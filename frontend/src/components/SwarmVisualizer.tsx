'use client';

const AGENTS = [
  { id: 'orchestrator', label: 'Orchestrator', icon: '🧠', x: 50, y: 50 },
  { id: 'pricer',       label: 'Pricer',       icon: '📊', x: 50, y: 10 },
  { id: 'trader',       label: 'Trader',       icon: '⚡', x: 85, y: 30 },
  { id: 'staker',       label: 'Staker',       icon: '🏦', x: 85, y: 70 },
  { id: 'auditor',      label: 'Auditor',      icon: '🔍', x: 50, y: 90 },
];

interface Task { id: string; type: string; assignedTo?: string; status: string; }
interface Props { activeAgents: string[]; currentTasks: Task[]; }

export default function SwarmVisualizer({ activeAgents, currentTasks }: Props) {
  const center = AGENTS[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-hedera rounded-full animate-pulse" />
        Swarm Topology
      </h3>
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Spoke lines from orchestrator to specialists */}
          {AGENTS.slice(1).map(a => (
            <line
              key={a.id}
              x1={center.x} y1={center.y}
              x2={a.x} y2={a.y}
              stroke={activeAgents.includes(a.id) ? '#8259EF' : '#334155'}
              strokeWidth="0.8"
              strokeDasharray={activeAgents.includes(a.id) ? '2 1' : undefined}
            />
          ))}
          {/* Agent nodes */}
          {AGENTS.map(a => {
            const isActive = activeAgents.includes(a.id);
            return (
              <g key={a.id}>
                {isActive && (
                  <circle cx={a.x} cy={a.y} r="8" fill="#8259EF" opacity="0.2">
                    <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={a.x} cy={a.y} r="6"
                  fill={isActive ? '#8259EF' : '#1e293b'}
                  stroke={isActive ? '#A07FF5' : '#475569'}
                  strokeWidth="1"
                />
                <text x={a.x} y={a.y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="4">
                  {a.icon}
                </text>
                <text x={a.x} y={a.y + 9} textAnchor="middle" fontSize="2.8" fill={isActive ? '#c4b5fd' : '#64748b'}>
                  {a.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Task list */}
      {currentTasks.length > 0 && (
        <div className="mt-3 space-y-1">
          {currentTasks.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'done' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-slate-400">{t.type}</span>
              {t.assignedTo && <span className="text-hedera">→ {t.assignedTo}</span>}
              <span className={`ml-auto ${t.status === 'done' ? 'text-green-400' : 'text-yellow-400'}`}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
