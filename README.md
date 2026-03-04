# HederaSwarm 🐝

> **Hello Future Apex Hackathon — AI & Agents Track**
> Multi-agent DeFi coordinator powered by Hedera Consensus Service

HederaSwarm is a **multi-agent AI system** where specialized agents coordinate on-chain via **Hedera Consensus Service (HCS)** to decompose, plan, and execute DeFi operations via **Hedera Token Service (HTS)** — all from a natural language command.

## 🏆 Hackathon

**Hello Future Apex Hackathon — AI & Agents Track | $250K prize pool**
Deadline: March 23, 2026

## 🎯 What It Does

```
User: "Swap 100 HBAR for USDC, then stake half the proceeds"

         ┌─────────────────────────────────────┐
         │         Orchestrator Agent           │
         │  (decomposes intent via Claude AI)   │
         └──────────────┬──────────────────────┘
                        │ publishes to HCS topic
              ┌─────────┼─────────┐
              ▼         ▼         ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ Pricer   │ │ Trader │ │  Staker  │
        │  Agent   │ │ Agent  │ │  Agent   │
        └──────────┘ └────────┘ └──────────┘
              │         │         │
              └─────────┼─────────┘
                        │ results published to HCS
                        ▼
              ┌──────────────────┐
              │  Audit Agent     │
              │ (verifies trail) │
              └──────────────────┘
```

Each agent:
1. **Subscribes** to a shared HCS topic for intent messages
2. **Claims** tasks matching its specialization
3. **Executes** via Hedera Agent Kit (HTS operations, price feeds)
4. **Posts results** back to HCS — immutable on-chain audit trail

## 🏗 Architecture

```
backend/                 Node.js + Hedera Agent Kit
  src/
  ├── agents/
  │   ├── orchestrator.ts   Decomposes NL intent → sub-tasks
  │   ├── pricer.ts         Fetches prices via Pyth/CoinCap plugins
  │   ├── trader.ts         Executes HTS token transfers/swaps
  │   ├── staker.ts         Manages staking positions
  │   └── auditor.ts        Reads HCS, verifies audit trail
  ├── hcs/
  │   ├── topic.ts          HCS topic management
  │   └── bus.ts            Agent message bus (pub/sub over HCS)
  ├── kit/
  │   └── client.ts         Hedera Agent Kit setup
  └── server.ts             Express API + SSE stream

frontend/                Next.js 14
  src/app/
  ├── page.tsx              Landing page
  ├── dashboard/            Swarm command center
  └── demo/                 No-auth interactive demo
```

## 🔑 Key Innovations

1. **HCS as agent message bus** — all inter-agent coordination is on-chain, verifiable, immutable
2. **Specialist swarm** — each agent has one job; Orchestrator composes them
3. **Real HTS execution** — actual token operations on Hedera testnet
4. **Natural language → on-chain** — Claude AI + Hedera Agent Kit bridge
5. **Live audit trail** — every decision logged to HCS, queryable via Mirror Node

## 🚀 Quick Start

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## 🌐 Live Demo

- **Frontend**: https://hederaswarm.vercel.app
- **Demo (no auth)**: https://hederaswarm.vercel.app/demo
- **API**: https://hederaswarm-api.railway.app

## 📋 Environment Variables

### Backend
```
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet
ANTHROPIC_API_KEY=sk-ant-...
HCS_SWARM_TOPIC_ID=0.0.xxxxx   # created on first run
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://hederaswarm-api.railway.app
```

## 📦 Tech Stack

- **Hedera Agent Kit** (`hedera-agent-kit`) — core Hedera integration
- **HCS** — Hedera Consensus Service for agent coordination
- **HTS** — Hedera Token Service for DeFi execution
- **Claude AI** — intent parsing and agent reasoning
- **LangChain** — agent orchestration framework
- **Next.js 14** — frontend
- **Express** — API server with SSE streaming

## 🔗 Resources

- [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit-js)
- [HCS Docs](https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service)
- [HTS Docs](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service)
