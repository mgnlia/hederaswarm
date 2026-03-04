import { v4 as uuidv4 } from 'uuid';
import { publishMessage, subscribeToSwarm, SwarmMessage } from '../hcs/bus.js';
import { DEMO_MODE } from '../kit/client.js';

const AGENT_NAME = 'staker';
const DEMO_APY = 0.085;

async function executeStake(token: string, amount: number) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
    const dailyYield = (amount * DEMO_APY) / 365;
    const annualYield = amount * DEMO_APY;
    return { token, stakedAmount: amount, apy: `${(DEMO_APY * 100).toFixed(1)}%`, dailyYield: dailyYield.toFixed(6), annualYield: annualYield.toFixed(4), positionId: `stake-${uuidv4().slice(0,8)}`, source: 'demo-hts' };
  }
  throw new Error('Real staking requires HEDERA credentials');
}

async function handleStakeTask(msg: SwarmMessage) {
  if (msg.type !== 'INTENT') return;
  const { intentId, tasks } = msg.payload as { intentId: string; tasks: Array<{ id: string; type: string; params: { token: string; amount: number } }> };
  for (const task of tasks) {
    if (task.type !== 'STAKE') continue;
    console.log(`[Staker] Claiming task ${task.id}: STAKE ${task.params.amount} ${task.params.token}`);
    await publishMessage({ id: uuidv4(), type: 'TASK_CLAIM', from: AGENT_NAME, payload: { intentId, taskId: task.id }, timestamp: new Date().toISOString() });
    try {
      const result = await executeStake(task.params.token, task.params.amount);
      await publishMessage({ id: uuidv4(), type: 'TASK_RESULT', from: AGENT_NAME, payload: { intentId, taskId: task.id, result, agentName: AGENT_NAME, executedAt: new Date().toISOString() }, timestamp: new Date().toISOString() });
      console.log(`[Staker] Completed task ${task.id}: staked ${task.params.amount} ${task.params.token} @ ${DEMO_APY*100}% APY`);
    } catch (err) {
      await publishMessage({ id: uuidv4(), type: 'TASK_RESULT', from: AGENT_NAME, payload: { intentId, taskId: task.id, result: { error: String(err) }, agentName: AGENT_NAME }, timestamp: new Date().toISOString() });
    }
  }
}

subscribeToSwarm(handleStakeTask);
console.log('[Staker Agent] Online — listening for STAKE tasks');
