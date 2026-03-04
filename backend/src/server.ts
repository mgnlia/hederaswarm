import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Response } from 'express';
import { initHederaClient } from './hcs/bus.js';
import { submitIntent, getAllIntents, getIntent, setBroadcast } from './agents/orchestrator.js';
import { getAuditTrail, verifyChain } from './agents/auditor.js';

// Import agents to activate subscriptions
import './agents/pricer.js';
import './agents/trader.js';
import './agents/staker.js';
import './agents/auditor.js';

dotenv.config();
initHederaClient();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3001');
const startTime = Date.now();

// SSE clients
const sseClients = new Set<Response>();

function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch { sseClients.delete(client); }
  }
}

setBroadcast(broadcast);

// Routes
app.post('/api/intent', async (req, res) => {
  try {
    const { command } = req.body as { command: string };
    if (!command?.trim()) return res.status(400).json({ error: 'command required' });
    const intent = await submitIntent(command.trim());
    res.json({ intentId: intent.id, tasks: intent.tasks, status: intent.status });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/intents', (_req, res) => {
  res.json(getAllIntents());
});

app.get('/api/intents/:id', (req, res) => {
  const intent = getIntent(req.params.id);
  if (!intent) return res.status(404).json({ error: 'Not found' });
  res.json(intent);
});

app.get('/api/audit', (_req, res) => {
  res.json({ entries: getAuditTrail(), valid: verifyChain(), count: getAuditTrail().length });
});

app.get('/api/status', (_req, res) => {
  res.json({
    agents: ['orchestrator', 'pricer', 'trader', 'staker', 'auditor'],
    topicId: process.env.HCS_SWARM_TOPIC_ID || '0.0.99999',
    demoMode: !process.env.HEDERA_PRIVATE_KEY,
    network: process.env.HEDERA_NETWORK || 'testnet',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    intents: getAllIntents().length,
    auditEntries: getAuditTrail().length,
  });
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  sseClients.add(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'HederaSwarm SSE connected' })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 30000);

  req.on('close', () => {
    sseClients.delete(res);
    clearInterval(heartbeat);
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[HederaSwarm] Server running on port ${PORT}`);
  console.log(`[HederaSwarm] Demo mode: ${!process.env.HEDERA_PRIVATE_KEY}`);
});
