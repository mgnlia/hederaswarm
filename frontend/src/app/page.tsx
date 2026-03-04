import Link from 'next/link';

const agents = [
  { name: 'Orchestrator', icon: '🧠', desc: 'Parses natural language intents and decomposes them into sub-tasks for specialist agents' },
  { name: 'Pricer', icon: '📊', desc: 'Fetches real-time prices via CoinCap and Pyth oracle integrations' },
  { name: 'Trader', icon: '⚡', desc: 'Executes token swaps via Hedera Token Service (HTS)' },
  { name: 'Staker', icon: '🏦', desc: 'Manages staking positions with yield calculations at 8.5% APY' },
  { name: 'Auditor', icon: '🔍', desc: 'Records all agent actions with SHA-256 hash-chained audit trail on HCS' },
];

const steps = [
  { n: 1, title: 'Natural Language Input', desc: 'You type a DeFi intent like "Swap 100 HBAR for USDC, then stake half"' },
  { n: 2, title: 'Orchestrator Decomposes', desc: 'Claude AI breaks the intent into typed sub-tasks and publishes to HCS topic' },
  { n: 3, title: 'Agents Coordinate via HCS', desc: 'Specialist agents claim tasks from the on-chain message bus — immutable, verifiable' },
  { n: 4, title: 'HTS Executes On-Chain', desc: 'Trader and Staker agents execute real token operations via Hedera Token Service' },
];

const tech = ['Hedera Agent Kit', 'Consensus Service (HCS)', 'Token Service (HTS)', 'Claude AI', 'LangChain', 'Next.js 14'];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐝</span>
          <span className="font-bold text-xl">HederaSwarm</span>
        </div>
        <div className="flex gap-4">
          <Link href="/demo" className="text-slate-400 hover:text-white transition-colors">Demo</Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          <a href="https://github.com/mgnlia/hederaswarm" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-hedera/10 border border-hedera/30 rounded-full px-4 py-1 text-sm text-hedera mb-6">
          🏆 Hello Future Apex Hackathon — AI & Agents Track
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          AI Agents.<br />
          <span className="text-hedera">On-Chain Consensus.</span><br />
          DeFi Execution.
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          A swarm of AI agents coordinate via <strong className="text-white">Hedera Consensus Service</strong> to decompose, plan, and execute DeFi operations — all from a single natural language command.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/demo" className="bg-hedera hover:bg-hedera-dark px-8 py-3 rounded-lg font-semibold transition-colors text-white">
            Try Demo →
          </Link>
          <Link href="/dashboard" className="border border-slate-700 hover:border-hedera px-8 py-3 rounded-lg font-semibold transition-colors text-slate-300 hover:text-white">
            Launch Dashboard
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-hedera/20 text-hedera rounded-full flex items-center justify-center font-bold mb-4">{s.n}</div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agents */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">The Swarm</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {agents.map((a) => (
            <div key={a.name} className="bg-slate-900 border border-slate-800 hover:border-hedera/50 rounded-xl p-5 transition-colors">
              <div className="text-3xl mb-3">{a.icon}</div>
              <h3 className="font-semibold mb-2">{a.name}</h3>
              <p className="text-slate-400 text-xs">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HCS Architecture callout */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-hedera/10 to-slate-900 border border-hedera/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">HCS as Agent Message Bus</h2>
          <p className="text-slate-300 mb-6">
            Every agent intent, task claim, and result is published to a shared <strong>Hedera Consensus Service topic</strong> — creating an immutable, publicly verifiable audit trail of every decision the swarm makes.
          </p>
          <code className="bg-slate-950 text-hedera px-4 py-2 rounded-lg text-sm font-mono">
            Topic: 0.0.99999 · Testnet · SHA-256 hash chain
          </code>
        </div>
      </section>

      {/* Tech stack */}
      <section className="px-6 py-12 max-w-4xl mx-auto text-center">
        <h3 className="text-slate-500 text-sm uppercase tracking-wider mb-6">Built With</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {tech.map((t) => (
            <span key={t} className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-full text-sm text-slate-300">{t}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-slate-500 text-sm">
        <p>HederaSwarm · Hello Future Apex Hackathon 2026 · <a href="https://github.com/mgnlia/hederaswarm" className="text-hedera hover:underline">GitHub</a></p>
      </footer>
    </main>
  );
}
