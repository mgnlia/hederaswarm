import { v4 as uuidv4 } from 'uuid';
import { publishMessage, subscribeToSwarm, SwarmMessage } from '../hcs/bus.js';
import { DEMO_MODE } from '../kit/client.js';

const AGENT_NAME = 'trader';

async function executeSwap(fromToken: string, toToken: string, amount: number) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
    const rates: Record<string, number> = { HBAR: 0.087, USDC: 1.0, ETH: 3241, BTC: 67420 };
    const fromRate = rates[fromToken] ?? 1;
    const toRate = rates[toToken] ?? 1;
    const received = (amount * fromRate) / toRate;
    return { fromToken, toToken, amountIn: amount, amountOut: received, txId: `0.0.${Date.now()}@${Date.now()}`, source: 'demo-hts' };
  }
  // Real HTS swap via Hedera Agent Kit would go here
  throw new Error('Real HTS swap requires HEDERA credentials');
}

async function handleTradeTask(msg: SwarmMessage) {
  if (msg.type !== 'INTENT') return;
  const { intentId, tasks } = msg.payload as { intentId: string; tasks: Array<{ id: string; type: string; params: { fromToken: string; toToken: string; amount: number } }> };
  for (const task of tasks) {
    if (task.type !== 'SWAP_TOKENS') continue;
    console.log(`[Trader] Claiming task ${task.id}: SWAP ${task.params.amount} ${task.params.fromToken} → ${task.params.toToken}`);
    await publishMessage({ id: uuidv4(), type: 'TASK_CLAIM', from: AGENT_NAME, payload: { intentId, taskId: task.id }, timestamp: new Date().toISOString() });
    try {
      const result = await executeSwap(task.params.fromToken, task.params.toToken, task.params.amount);
      await publishMessage({ id: uuidv4(), type: 'TASK_RESULT', from: AGENT_NAME, payload: { intentId, taskId: task.id, result, agentName: AGENT_NAME, executedAt: new Date().toISOString() }, timestamp: new Date().toISOString() });
      console.log(`[Trader] Completed task ${task.id}: swapped ${task.params.amount} ${task.params.fromToken} → ${result.amountOut.toFixed(4)} ${task.params.toToken}`);
    } catch (err) {
      await publishMessage({ id: uuidv4(), type: 'TASK_RESULT', from: AGENT_NAME, payload: { intentId, taskId: task.id, result: { error: String(err) }, agentName: AGENT_NAME }, timestamp: new Date().toISOString() });
    }
  }
}

subscribeToSwarm(handleTradeTask);
console.log('[Trader Agent] Online — listening for SWAP_TOKENS tasks');
