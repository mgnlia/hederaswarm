'use client';
import { useState } from 'react';
import Link from 'next/link';

interface HCSMsg { seq: number; type: string; from: string; payload: string; delay: number; }
interface Scenario { id: string; title: string; command: string; agents: string[]; messages: HCSMsg[]; result: string; }

const SCENARIOS: Scenario[] = [
  {
    id: 'swap',
    title: 'Swap 100 HBAR for USDC',
    command: 'Swap 100 HBAR for USDC at best price',
    agents: ['orchestrator', 'pricer', 'trader'],
    messages: [
      { seq: 1, type: 'INTENT', from: 'orchestrator', payload: '{"command":"Swap 100 HBAR for USDC","tasks":["GET_PRICE","SWAP_TOKENS"]}', delay: 0 },
      { seq: 2, type: 'PRICE_UPDATE', from: 'pricer', payload: '{"HBAR":0.087,"USDC":1.0,"source":"coincap"}', delay: 800 },
      { seq: 3, type: 'TASK_CLAIM', from: 'trader', payload: '{"taskId":"swap-001","type":"SWAP_TOKENS"}', delay: 1200 },
      { seq: 4, type: 'TASK_RESULT', from: 'trader', payload: '{"amountIn":100,"amountOut":8.7,"txId":"0.0.1234@1709550000","source":"demo-hts"}', delay: 2000 },
      { seq: 5, type: 'TASK_RESULT', from: 'auditor', payload: '{"recorded":true,"hash":"a3f2b1...","chainValid":true}', delay: 2200 },
    ],
    result: '✅ Swapped 100 HBAR → 8.70 USDC\nTx: 0.0.1234@1709550000\nAudit hash: a3f2b1c4...',
  },
  {
    id: 'stake',
    title: 'Stake 50 HBAR & get yield',
    command: 'Stake 50 HBAR and show me the expected yield',
    agents: ['orchestrator', 'pricer', 'staker'],
    messages: [
      { seq: 1, type: 'INTENT', from: 'orchestrator', payload: '{"command":"Stake 50 HBAR","tasks":["GET_PRICE","STAKE"]}', delay: 0 },
      { seq: 2, type: 'PRICE_UPDATE', from: 'pricer', payload: '{"HBAR":0.087,"apy":"8.5%"}', delay: 600 },
      { seq: 3, type: 'TASK_CLAIM', from: 'staker', payload: '{"taskId":"stake-001","type":"STAKE","amount":50}', delay: 1000 },
      { seq: 4, type: 'TASK_RESULT', from: 'staker', payload: '{"stakedAmount":50,"apy":"8.5%","dailyYield":"0.011644","annualYield":"4.2500","positionId":"stake-a7b2c3"}', delay: 1800 },
      { seq: 5, type: 'TASK_RESULT', from: 'auditor', payload: '{"recorded":true,"hash":"d9e8f7...","chainValid":true}', delay: 2000 },
    ],
    result: '✅ Staked 50 HBAR @ 8.5% APY\nDaily yield: 0.011644 HBAR\nAnnual yield: 4.25 HBAR\nPosition: stake-a7b2c3',
  },
  {
    id: 'airdrop',
    title: 'Create SWRM token & airdrop',
    command: 'Create a SWRM token and airdrop 1000 to 3 test wallets',
    agents: ['orchestrator', 'trader', 'auditor'],
    messages: [
      { seq: 1, type: 'INTENT', from: 'orchestrator', payload: '{"command":"Create SWRM token","tasks":["CREATE_TOKEN","AIRDROP"]}', delay: 0 },
      { seq: 2, type: 'TASK_CLAIM', from: 'trader', payload: '{"taskId":"create-001","type":"CREATE_TOKEN","symbol":"SWRM"}', delay: 500 },
      { seq: 3, type: 'TASK_RESULT', from: 'trader', payload: '{"tokenId":"0.0.5678","symbol":"SWRM","supply":1000000,"txId":"0.0.5678@1709550100"}', delay: 1400 },
      { seq: 4, type: 'TASK_CLAIM', from: 'trader', payload: '{"taskId":"airdrop-001","type":"AIRDROP","recipients":3}', delay: 1600 },
      { seq: 5, type: 'TASK_RESULT', from: 'trader', payload: '{"distributed":3000,"recipients":["0.0.111","0.0.222","0.0.333"],"each":1000}', delay: 2400 },
      { seq: 6, type: 'TASK_RESULT', from: 'auditor', payload: '{"recorded":2,"hash":"f1a2b3...","chainValid":true,"totalEntries":6}', delay: 2600 },
    ],
    result: '✅ Created SWRM token (0.0.5678)\nAirdropped 1,000 SWRM to 3 wallets\nTotal distributed: 3,000 SWRM\nAudit chain: 6 entries, valid ✓',
  },
];

const AGENT_COLORS: Record<string, string> = {
  orchestrator: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  pricer: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  trader: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  staker: 'bg-green-500/20 text-green-300 border-green-500/30',
  auditor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};
const TYPE_COLORS: Record<string, string> = {
  INTENT: 'text-blue-400', PRICE_UPDATE: 'text-purple-400',
  TASK_CLAIM: 'text-yellow-400', TASK_RESULT: 'text-green-400',
};

export default function DemoPage() {
  const [active, setActive] = useState<string | null>(null);
  const [visibleMsgs, setVisibleMsgs] = useState<HCSMsg[]>([]);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runScenario = async (s: Scenario) => {
    if (running) return;
    setActive(s.id);
    setVisibleMsgs([]);
    setActiveAgents([]);
    setResult(null);
    setRunning(true);

    for (const msg of s.messages) {
      await new Promise(r => setTimeout(r, msg.delay > 0 ? msg.delay - (s.messages[s.messages.indexOf(msg) - 1]?.delay ?? 0) : 0));
      setVisibleMsgs(prev => [...prev, msg]);
      setActiveAgents(prev => [...new Set([...prev, msg.from])]);
    }

    await new Promise(r => setTimeout(r, 400));
    setResult(s.result);
    setRunning(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-white text-sm">← Home</Link>
          <span className="text-slate-700">/</span>
          <h1 className="text-xl font-bold">🎮 Interactive Demo</h1>
          <span className="text-xs bg-hedera/20 text-hedera border border-hedera/30 px-2 py-0.5 rounded-full">No backend needed</span>
        </div>

        <p className="text-slate-400">Select a scenario to watch the agent swarm coordinate in real-time via simulated HCS messages.</p>

        {/* Scenario selector */}
        <div className="grid md:grid-cols-3 gap-4">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => runScenario(s)}
              disabled={running}
              className={`text-left p-5 rounded-xl border transition-all ${active === s.id ? 'border-hedera bg-hedera/10' : 'border-slate-800 bg-slate-900 hover:border-hedera/50'} disabled:opacity-60`}
            >
              <div className="font-semibold mb-2">{s.title}</div>
              <div className="text-xs text-slate-500 mb-3">{s.command}</div>
              <div className="flex flex-wrap gap-1">
                {s.agents.map(a => (
                  <span key={a} className={`text-[10px] px-1.5 py-0.5 rounded border ${activeAgents.includes(a) && active === s.id ? AGENT_COLORS[a] : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                    {a}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* HCS message feed */}
        {active && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${running ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                HCS Topic Messages — Live Simulation
              </h3>
              <span className="text-xs text-slate-500">{visibleMsgs.length} messages</span>
            </div>
            <div className="p-4 space-y-2 font-mono text-xs min-h-48">
              {visibleMsgs.map((msg) => (
                <div key={msg.seq} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <span className="text-slate-600 w-5 text-right shrink-0">#{msg.seq}</span>
                  <span className={`shrink-0 font-semibold ${TYPE_COLORS[msg.type] ?? 'text-slate-400'}`}>{msg.type}</span>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] ${AGENT_COLORS[msg.from] ?? ''}`}>{msg.from}</span>
                  <span className="text-slate-400 truncate">{msg.payload}</span>
                </div>
              ))}
              {running && (
                <div className="flex gap-2 items-center text-slate-600">
                  <span className="animate-pulse">▋</span> agents processing...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
            <h3 className="font-semibold text-green-400 mb-2">Execution Complete</h3>
            <pre className="text-sm text-green-300 whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-6">
          <p className="text-slate-500 mb-4">Ready to try with real Hedera testnet credentials?</p>
          <Link href="/dashboard" className="bg-hedera hover:bg-hedera-dark px-6 py-2.5 rounded-lg font-semibold transition-colors inline-block">
            Open Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
