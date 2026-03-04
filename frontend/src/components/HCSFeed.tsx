'use client';
import { useEffect, useRef } from 'react';

export interface SwarmMessage {
  id: string;
  type: string;
  from: string;
  timestamp: string;
  payload: Record<string, unknown>;
  seqNum?: number;
}

const TYPE_COLORS: Record<string, string> = {
  INTENT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  TASK_CLAIM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  TASK_RESULT: 'bg-green-500/20 text-green-300 border-green-500/30',
  PRICE_UPDATE: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  ERROR: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const AGENT_ICONS: Record<string, string> = {
  orchestrator: '🧠', pricer: '📊', trader: '⚡', staker: '🏦', auditor: '🔍',
};

interface Props { messages: SwarmMessage[]; }

export default function HCSFeed({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl h-96 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          HCS Message Feed
        </h3>
        <span className="text-xs text-slate-500">{messages.length} messages</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {messages.length === 0 && (
          <div className="text-slate-600 text-center py-8">
            Waiting for HCS messages...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className="flex gap-2 items-start">
            <span className="text-slate-600 w-6 text-right shrink-0">#{msg.seqNum ?? i + 1}</span>
            <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${TYPE_COLORS[msg.type] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
              {msg.type}
            </span>
            <span className="shrink-0">{AGENT_ICONS[msg.from] ?? '🤖'}</span>
            <span className="text-slate-300 truncate flex-1">
              {msg.from}: {JSON.stringify(msg.payload).slice(0, 80)}...
            </span>
            <span className="text-slate-600 shrink-0 text-[10px]">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
