/**
 * Orchestrator Agent
 * 
 * Receives natural language DeFi intents, uses Claude AI to decompose them
 * into sub-tasks, then publishes each task to the HCS swarm topic for
 * specialist agents to claim and execute.
 */
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { publishMessage, subscribeToSwarm, SwarmMessage } from '../hcs/bus.js';
import { DEMO_MODE } from '../kit/client.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'demo',
});

export interface DeFiTask {
  id: string;
  type: 'GET_PRICE' | 'SWAP_TOKENS' | 'TRANSFER_HBAR' | 'STAKE' | 'CREATE_TOKEN' | 'AIRDROP';
  params: Record<string, unknown>;
  dependsOn?: string[];  // task IDs this depends on
}

export interface SwarmIntent {
  id: string;
  raw: string;
  tasks: DeFiTask[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results: Record<string, unknown>;
  createdAt: string;
}

const activeIntents = new Map<string, SwarmIntent>();

// SSE broadcast function (injected from server)
let broadcastFn: ((event: string, data: unknown) => void) | null = null;
export function setBroadcast(fn: typeof broadcastFn) { broadcastFn = fn; }

function broadcast(event: string, data: unknown) {
  broadcastFn?.(event, data);
}

const DECOMPOSE_SYSTEM = `You are an AI DeFi orchestrator on the Hedera blockchain network.
Your job is to decompose a natural language DeFi intent into a list of concrete sub-tasks.

Available task types:
- GET_PRICE: Fetch current price of a token (params: { symbol: string })
- SWAP_TOKENS: Swap one token for another (params: { fromToken: string, toToken: string, amount: number })
- TRANSFER_HBAR: Transfer HBAR to an address (params: { to: string, amount: number })
- STAKE: Stake tokens (params: { token: string, amount: number })
- CREATE_TOKEN: Create a new HTS token (params: { name: string, symbol: string, initialSupply: number })
- AIRDROP: Airdrop tokens to multiple accounts (params: { token: string, recipients: string[], amount: number })

Return a JSON array of tasks. Each task has:
- id: unique string
- type: one of the above
- params: task-specific parameters
- dependsOn: array of task IDs this task depends on (empty if none)

Be concise. Return ONLY valid JSON array, no explanation.`;

async function decomposeIntent(raw: string): Promise<DeFiTask[]> {
  if (DEMO_MODE || !process.env.ANTHROPIC_API_KEY) {
    return getDemoTasks(raw);
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: DECOMPOSE_SYSTEM,
      messages: [{ role: 'user', content: raw }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return getDemoTasks(raw);
    return JSON.parse(jsonMatch[0]) as DeFiTask[];
  } catch (err) {
    console.error('[Orchestrator] Claude error, using demo tasks:', err);
    return getDemoTasks(raw);
  }
}

function getDemoTasks(raw: string): DeFiTask[] {
  const lower = raw.toLowerCase();

  if (lower.includes('price') || lower.includes('how much')) {
    return [{
      id: uuidv4(),
      type: 'GET_PRICE',
      params: { symbol: lower.includes('hbar') ? 'HBAR' : 'BTC' },
      dependsOn: [],
    }];
  }

  if (lower.includes('swap') || lower.includes('exchange')) {
    const priceTask: DeFiTask = { id: uuidv4(), type: 'GET_PRICE', params: { symbol: 'HBAR' }, dependsOn: [] };
    const swapTask: DeFiTask = { id: uuidv4(), type: 'SWAP_TOKENS', params: { fromToken: 'HBAR', toToken: 'USDC', amount: 100 }, dependsOn: [priceTask.id] };
    return [priceTask, swapTask];
  }

  if (lower.includes('stake')) {
    const priceTask: DeFiTask = { id: uuidv4(), type: 'GET_PRICE', params: { symbol: 'HBAR' }, dependsOn: [] };
    const swapTask: DeFiTask = { id: uuidv4(), type: 'SWAP_TOKENS', params: { fromToken: 'HBAR', toToken: 'USDC', amount: 100 }, dependsOn: [priceTask.id] };
    const stakeTask: DeFiTask = { id: uuidv4(), type: 'STAKE', params: { token: 'HBAR', amount: 50 }, dependsOn: [swapTask.id] };
    return [priceTask, swapTask, stakeTask];
  }

  if (lower.includes('airdrop')) {
    return [{
      id: uuidv4(),
      type: 'AIRDROP',
      params: { token: 'HSWARM', recipients: ['0.0.1001', '0.0.1002', '0.0.1003'], amount: 100 },
      dependsOn: [],
    }];
  }

  if (lower.includes('create') && lower.includes('token')) {
    return [{
      id: uuidv4(),
      type: 'CREATE_TOKEN',
      params: { name: 'SwarmToken', symbol: 'SWRM', initialSupply: 1000000 },
      dependsOn: [],
    }];
  }

  // Default: price + swap + stake
  const priceTask: DeFiTask = { id: uuidv4(), type: 'GET_PRICE', params: { symbol: 'HBAR' }, dependsOn: [] };
  const swapTask: DeFiTask = { id: uuidv4(), type: 'SWAP_TOKENS', params: { fromToken: 'HBAR', toToken: 'USDC', amount: 100 }, dependsOn: [priceTask.id] };
  return [priceTask, swapTask];
}

export async function submitIntent(raw: string): Promise<SwarmIntent> {
  console.log(`[Orchestrator] New intent: "${raw}"`);

  const intentId = uuidv4();
  const tasks = await decomposeIntent(raw);

  const intent: SwarmIntent = {
    id: intentId,
    raw,
    tasks,
    status: 'pending',
    results: {},
    createdAt: new Date().toISOString(),
  };

  activeIntents.set(intentId, intent);
  broadcast('intent_created', { intentId, tasks: tasks.length, raw });

  // Publish intent to HCS swarm
  await publishMessage({
    id: uuidv4(),
    type: 'INTENT',
    from: 'orchestrator',
    payload: { intentId, tasks, raw },
    timestamp: new Date().toISOString(),
  });

  intent.status = 'in_progress';
  broadcast('intent_started', { intentId, tasks });

  return intent;
}

export function handleTaskResult(msg: SwarmMessage) {
  if (msg.type !== 'TASK_RESULT') return;
  const { intentId, taskId, result, agentName } = msg.payload as {
    intentId: string;
    taskId: string;
    result: unknown;
    agentName: string;
  };

  const intent = activeIntents.get(intentId);
  if (!intent) return;

  intent.results[taskId] = result;
  broadcast('task_completed', { intentId, taskId, result, agentName });

  // Check if all tasks done
  const allDone = intent.tasks.every(t => t.id in intent.results);
  if (allDone) {
    intent.status = 'completed';
    broadcast('intent_completed', { intentId, results: intent.results });
    console.log(`[Orchestrator] Intent ${intentId} completed`);
  }
}

export function getIntent(intentId: string): SwarmIntent | undefined {
  return activeIntents.get(intentId);
}

export function getAllIntents(): SwarmIntent[] {
  return Array.from(activeIntents.values()).slice(-20);
}

// Subscribe to swarm results
subscribeToSwarm((msg) => {
  if (msg.type === 'TASK_RESULT') handleTaskResult(msg);
});
