/**
 * HCS Agent Message Bus
 * 
 * All inter-agent coordination happens via Hedera Consensus Service.
 * Messages are published to a shared topic and agents subscribe to receive tasks.
 * This creates an immutable, on-chain audit trail of every agent action.
 */
import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
  AccountId,
} from '@hashgraph/sdk';
import { EventEmitter } from 'events';
import { DEMO_MODE } from '../kit/client.js';

export interface SwarmMessage {
  id: string;
  type: 'INTENT' | 'TASK_CLAIM' | 'TASK_RESULT' | 'AUDIT' | 'STATUS';
  from: string;           // agent name
  to?: string;            // target agent (optional, broadcast if omitted)
  payload: Record<string, unknown>;
  timestamp: string;
  sequenceNumber?: number;
}

// In-memory bus for demo mode (mirrors what HCS would do)
const demoBus = new EventEmitter();
const demoMessages: SwarmMessage[] = [];
let demoSeq = 0;

// Real Hedera client for production
let hederaClient: Client | null = null;
let swarmTopicId: TopicId | null = null;

export function initHederaClient() {
  if (DEMO_MODE) return;
  const accountId = process.env.HEDERA_ACCOUNT_ID!;
  const privateKey = process.env.HEDERA_PRIVATE_KEY!;
  const network = process.env.HEDERA_NETWORK || 'testnet';

  hederaClient = network === 'mainnet'
    ? Client.forMainnet()
    : Client.forTestnet();

  hederaClient.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));

  const topicIdStr = process.env.HCS_SWARM_TOPIC_ID;
  if (topicIdStr) {
    swarmTopicId = TopicId.fromString(topicIdStr);
    console.log(`[HCS Bus] Connected to topic ${topicIdStr}`);
  }
}

export async function createSwarmTopic(): Promise<string> {
  if (DEMO_MODE) {
    const demoTopicId = '0.0.99999';
    console.log(`[HCS Bus] Demo mode — using mock topic ${demoTopicId}`);
    return demoTopicId;
  }

  if (!hederaClient) throw new Error('Hedera client not initialized');

  const tx = await new TopicCreateTransaction()
    .setTopicMemo('HederaSwarm agent coordination bus')
    .execute(hederaClient);

  const receipt = await tx.getReceipt(hederaClient);
  const topicId = receipt.topicId!.toString();
  swarmTopicId = receipt.topicId!;
  console.log(`[HCS Bus] Created swarm topic: ${topicId}`);
  return topicId;
}

export async function publishMessage(msg: SwarmMessage): Promise<void> {
  const payload = JSON.stringify(msg);

  if (DEMO_MODE) {
    msg.sequenceNumber = ++demoSeq;
    demoMessages.push(msg);
    demoBus.emit('message', msg);
    console.log(`[HCS Bus] [DEMO] Published: ${msg.type} from ${msg.from}`);
    return;
  }

  if (!hederaClient || !swarmTopicId) {
    throw new Error('HCS bus not initialized');
  }

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(swarmTopicId)
    .setMessage(payload)
    .execute(hederaClient);

  const receipt = await tx.getReceipt(hederaClient);
  msg.sequenceNumber = receipt.topicSequenceNumber?.toNumber();
  console.log(`[HCS Bus] Published seq#${msg.sequenceNumber}: ${msg.type} from ${msg.from}`);
}

export function subscribeToSwarm(handler: (msg: SwarmMessage) => void): () => void {
  if (DEMO_MODE) {
    demoBus.on('message', handler);
    return () => demoBus.off('message', handler);
  }

  // In production, would use HCS mirror node subscription
  // For now, use polling via Mirror Node REST API
  let active = true;
  let lastSeq = 0;

  const poll = async () => {
    while (active) {
      try {
        const topicIdStr = swarmTopicId?.toString();
        if (!topicIdStr) break;

        const url = `https://${process.env.HEDERA_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'}-public.mirrornode.hedera.com/api/v1/topics/${topicIdStr}/messages?sequencenumber=gt:${lastSeq}&limit=100`;
        const resp = await fetch(url);
        const data = await resp.json() as { messages?: Array<{ sequence_number: number; message: string }> };

        for (const raw of data.messages || []) {
          lastSeq = raw.sequence_number;
          try {
            const decoded = Buffer.from(raw.message, 'base64').toString('utf-8');
            const msg = JSON.parse(decoded) as SwarmMessage;
            msg.sequenceNumber = raw.sequence_number;
            handler(msg);
          } catch { /* skip malformed */ }
        }
      } catch { /* network error, retry */ }
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  poll();
  return () => { active = false; };
}

export function getRecentMessages(limit = 50): SwarmMessage[] {
  return demoMessages.slice(-limit);
}
