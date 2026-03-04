import { createHash } from 'crypto';
import { subscribeToSwarm, SwarmMessage } from '../hcs/bus.js';

const AGENT_NAME = 'auditor';

export interface AuditEntry {
  index: number;
  messageId: string;
  type: string;
  from: string;
  timestamp: string;
  hash: string;
  prevHash: string;
  payload: Record<string, unknown>;
}

const auditTrail: AuditEntry[] = [];
let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

function hashEntry(prevHash: string, msg: SwarmMessage): string {
  return createHash('sha256').update(prevHash + JSON.stringify(msg)).digest('hex');
}

function recordMessage(msg: SwarmMessage) {
  const hash = hashEntry(lastHash, msg);
  const entry: AuditEntry = {
    index: auditTrail.length,
    messageId: msg.id,
    type: msg.type,
    from: msg.from,
    timestamp: msg.timestamp,
    hash,
    prevHash: lastHash,
    payload: msg.payload,
  };
  auditTrail.push(entry);
  lastHash = hash;
  console.log(`[Auditor] Recorded #${entry.index} ${msg.type} from ${msg.from} hash=${hash.slice(0,16)}...`);
}

export function getAuditTrail(limit = 100): AuditEntry[] {
  return auditTrail.slice(-limit);
}

export function verifyChain(): boolean {
  if (auditTrail.length === 0) return true;
  let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  for (const entry of auditTrail) {
    if (entry.prevHash !== prevHash) return false;
    prevHash = entry.hash;
  }
  return true;
}

subscribeToSwarm(recordMessage);
console.log('[Auditor Agent] Online — recording all HCS messages with SHA-256 hash chain');
