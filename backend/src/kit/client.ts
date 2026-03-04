/**
 * Hedera Agent Kit client setup.
 * Initialises HederaAgentKit with the operator account and plugins.
 */
import { HederaAgentKit } from 'hedera-agent-kit';
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

let _kit: HederaAgentKit | null = null;

export function getKit(): HederaAgentKit {
  if (_kit) return _kit;

  const accountId = process.env.HEDERA_ACCOUNT_ID || '0.0.1234';
  const privateKey = process.env.HEDERA_PRIVATE_KEY || 'demo-key';
  const network = (process.env.HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'previewnet';

  const isDemoMode = !process.env.HEDERA_PRIVATE_KEY || privateKey === 'demo-key';

  if (isDemoMode) {
    console.warn('[HederaKit] Running in DEMO MODE — no real Hedera transactions will be submitted');
    // Return a mock kit for demo purposes
    _kit = {
      accountId,
      network,
      isDemo: true,
    } as any;
    return _kit!;
  }

  _kit = new HederaAgentKit(accountId, privateKey, network);
  console.log(`[HederaKit] Initialized on ${network} as ${accountId}`);
  return _kit;
}

export const DEMO_MODE = !process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY === 'demo-key';
