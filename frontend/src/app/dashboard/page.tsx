'use client';
import { useState, useEffect, useCallback } from 'react';
import CommandBar from '@/components/CommandBar';
import SwarmVisualizer from '@/components/SwarmVisualizer';
import HCSFeed, { SwarmMessage } from '@/components/HCSFeed';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Intent { id: string; command: string; status: string; tasks: Array<{ id: string; type: string; assignedTo?: string; status: string }>; createdAt: string; }
interface Status { agents: string[]; topicId: string; demoMode: boolean; uptime: number; intents: number; auditEntries: number; }

export default function Dashboard() {
  const [messages, setMessages] = useState<SwarmMessage[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [activeAgents, setActiveAgents] = useState<string[]>(['orchestrator']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll status
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${API}/api/status`);
        if (r.ok) setStatus(await r.json());
      } catch { /* backend offline */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  // Poll intents
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${API}/api/intents`);
        if (r.ok) setIntents(await r.json());
      } catch { /* offline */ }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  // SSE stream
  useEffect(() => {
    let es: EventSource;
    try {
      es = new EventSource(`${API}/api/stream`);
      es.addEventListener('intent', (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => [...prev.slice(-99), { ...data, seqNum: prev.length + 1 }]);
        setActiveAgents(['orchestrator']);
      });
      es.addEventListener('task_claim', (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => [...prev.slice(-99), { ...data, seqNum: prev.length + 1 }]);
        if (data.from) setActiveAgents(prev => [...new Set([...prev, data.from])]);
      });
      es.addEventListener('task_result', (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => [...prev.slice(-99), { ...data, seqNum: prev.length + 1 }]);
      });
      es.onerror = () => { /* reconnects automatically */ };
    } catch { /* SSE not available */ }
    return () => es?.close();
  }, []);

  const handleSubmit = useCallback(async (command: string) => {
    setLoading(true);
    setError(null);
    setActiveAgents(['orchestrator']);
    try {
      const r = await fetch(`${API}/api/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      // Add mock HCS messages for demo
      const now = new Date().toISOString();
      setMessages(prev => [
        ...prev,
        { id: data.intentId, type: 'INTENT', from: 'orchestrator', timestamp: now, payload: { command, intentId: data.intentId }, seqNum: prev.length + 1 },
      ]);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const currentTasks = intents.flatMap(i => i.tasks ?? []).slice(-8);

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-500 hover:text-white text-sm">← Home</Link>
            <span className="text-slate-700">/</span>
            <h1 className="text-xl font-bold flex items-center gap-2">🐝 HederaSwarm Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {status ? (
              <>
                <span className="flex items-center gap-1.5 text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {status.demoMode ? 'Demo Mode' : 'Live — Testnet'}
                </span>
                <span className="text-slate-500">Topic: {status.topicId}</span>
                <span className="text-slate-500">↑ {status.uptime}s</span>
              </>
            ) : (
              <span className="text-slate-600 text-xs">Backend offline — showing demo</span>
            )}
          </div>
        </div>

        {/* Command Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Submit Intent</h2>
          <CommandBar onSubmit={handleSubmit} loading={loading} />
          {error && <p className="mt-2 text-red-400 text-sm">⚠ {error}</p>}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <SwarmVisualizer activeAgents={activeAgents} currentTasks={currentTasks} />
          <div className="lg:col-span-2">
            <HCSFeed messages={messages} />
          </div>
        </div>

        {/* Intents list */}
        {intents.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Recent Intents</h2>
            <div className="space-y-2">
              {intents.slice(-5).reverse().map(intent => (
                <div key={intent.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${intent.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                  <span className="text-sm flex-1 truncate">{intent.command}</span>
                  <span className="text-xs text-slate-500">{intent.tasks?.length ?? 0} tasks</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${intent.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {intent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats row */}
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Agents Online', value: status.agents.length },
              { label: 'Total Intents', value: status.intents },
              { label: 'Audit Entries', value: status.auditEntries },
              { label: 'Network', value: 'Hedera Testnet' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-hedera">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
