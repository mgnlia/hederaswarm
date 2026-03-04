/**
 * Pricer Agent
 * 
 * Specialist agent that handles GET_PRICE tasks.
 * Fetches real-time prices via CoinCap / Pyth plugins.
 * Publishes results back to HCS.
 */
import { v4 as uuidv4 } from 'uuid';
import { publishMessage, subscribeToSwarm, SwarmMessage } from '../hcs/bus.js';
import { DEMO_MODE } from '../kit/client.js';

const AGENT_NAME = 'pricer';

// Demo price data
const DEMO_PRICES: Record<string, number> = {
  HBAR: 0.087,
  BTC: 67420,
  ETH: 3241,
  USDC: 1.00,
  USDT: 1.00,
  LINK: 14.23,
};

async function fetchPrice(symbol: string): Promise<{ symbol: string; price: number; source: string }> {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
    const price = DEMO_PRICES[symbol.toUpperCase()] ?? 1.0;
    return { symbol, price, source: 'demo-coincap' };
  }

  try {
    // Use CoinCap API (free, no key required)
    const coinId = symbol.toLowerCase() === 'hbar' ? 'hedera-hashgraph' :
                   symbol.toLowerCase() === 'btc' ? 'bitcoin' :
                   symbol.toLowerCase() === 'eth' ? 'ethereum' :
                   symbol.toLowerCase();

    const resp = await fetch(`https://api.coincap.io/v2/assets/${coinId}`);
    const data = await resp.json() as { data?: { priceUsd: string } };
    const price = parseFloat(data.data?.priceUsd ?? '0');
    return { symbol, price, source: 'coincap' };
  } catch {
    const price = DEMO_PRICES[symbol.toUpperCase()] ?? 1.0;
    return { symbol, price, source: 'fallback' };
  }
}

async function handlePriceTask(msg: SwarmMessage) {
  if (msg.type !== 'INTENT') return;

  const { intentId, tasks } = msg.payload as {
    intentId: string;
    tasks: Array<{ id: string; type: string; params: { symbol: string } }>;
  };

  for (const task of tasks) {
    if (task.type !== 'GET_PRICE') continue;

    console.log(`[Pricer] Claiming task ${task.id}: GET_PRICE ${task.params.symbol}`);

    // Claim the task
    await publishMessage({
      id: uuidv4(),
      type: 'TASK_CLAIM',
      from: AGENT_NAME,
      payload: { intentId, taskId: task.id },
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await fetchPrice(task.params.symbol);

      // Publish result to HCS
      await publishMessage({
        id: uuidv4(),
        type: 'TASK_RESULT',
        from: AGENT_NAME,
        payload: {
          intentId,
          taskId: task.id,
          result,
          agentName: AGENT_NAME,
          executedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      console.log(`[Pricer] Completed task ${task.id}: ${task.params.symbol} = $${result.price}`);
    } catch (err) {
      console.error(`[Pricer] Task ${task.id} failed:`, err);
      await publishMessage({
        id: uuidv4(),
        type: 'TASK_RESULT',
        from: AGENT_NAME,
        payload: { intentId, taskId: task.id, result: { error: String(err) }, agentName: AGENT_NAME },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Subscribe to swarm
subscribeToSwarm(handlePriceTask);
console.log('[Pricer Agent] Online — listening for GET_PRICE tasks');

export { AGENT_NAME as pricerAgentName };
