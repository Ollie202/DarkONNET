# DarkONNET

**A privacy-preserving prediction market built on Zama's Fully Homomorphic Encryption (FHE) protocol.**

DarkONNET lets users place encrypted bets on real-world events — sports, crypto, politics, esports, and more — without ever revealing their position size or account balance on-chain. All bets and pool totals remain encrypted at the EVM level. Settlement and payouts are computed directly on ciphertext.

> Built for the Zama Developer Program — Builder Track, Season 2.

---

## The Problem

Public blockchains expose everything. On a standard prediction market, anyone can see your position size, your wallet's balance, and the exact pool split at any time. This enables front-running, discourages large positions, and makes institutional participation impossible.

## The Solution

DarkONNET uses Zama's fhEVM to keep every bet amount encrypted on-chain using `euint64`. The contract performs arithmetic on encrypted values — adding positions to pools, computing payouts, issuing refunds — without any plaintext ever touching the chain. Users get the transparency of a decentralised market with the confidentiality of a private system.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)              │
│  wagmi v2 · RainbowKit · @zama-fhe/react-sdk        │
│  Reads Supabase directly · calls contracts via viem  │
└────────────────┬───────────────────┬─────────────────┘
                 │                   │
     ┌───────────▼──────┐  ┌────────▼──────────────┐
     │  Supabase         │  │  Smart Contracts       │
     │  markets          │  │  (Zama fhEVM Sepolia)  │
     │  comments         │  │                        │
     │  notifications    │  │  ConfidentialPrediction│
     │  profiles         │  │  Market.sol            │
     └───────────▲──────┘  │  EncryptedERC20.sol     │
                 │          │  (cUSDT)                │
     ┌───────────┴──────┐  │  ConfidentialUSDT       │
     │  Backend API      │  │  Faucet.sol             │
     │  (Node / Railway) │  └─────────────────────────┘
     │  SIWE auth        │
     │  REST + WebSocket │
     └───────────▲──────┘
                 │
     ┌───────────┴──────────────────────────────────┐
     │  Oracle / Relayer Services                    │
     │  Sports · Esports · Crypto · Politics · Tech  │
     │  Creates markets on-chain · Settles results   │
     │  Writes metadata to Supabase                  │
     └───────────────────────────────────────────────┘
```

---

## Deployed Contracts (Sepolia)

| Contract                       | Address                                      |
| ------------------------------ | -------------------------------------------- |
| `ConfidentialPredictionMarket` | `0x3cA14ae6ae8eCDD32023D2041aF2B60F2c58DD6B` |
| `EncryptedERC20` (cUSDT)       | `0x0CbC92CA4D7eD07e935dc93bf6Ca6A5e26682035` |
| `ConfidentialUSDTFaucet`       | `0xcDda033C5F914cCBFf39D7517cc4Dba54Bf7eeD9` |

---

## How It Works

### Encrypted Betting

1. User connects their wallet on Sepolia
2. Claims test cUSDT from the faucet (1,000 cUSDT, 24-hour cooldown)
3. Picks a market and a side (Yes / No)
4. The frontend uses `@zama-fhe/react-sdk` to encrypt the bet amount into an `externalEuint64` with a zero-knowledge proof
5. The frontend calls `approve` on cUSDT then `bet(marketId, outcome, encryptedValue, proof)` on the market contract
6. The contract adds the encrypted amount to the user's encrypted position and the encrypted pool total — no plaintext ever exists

### What Stays Private

- Individual position sizes
- Total pool sizes (until public decryption is explicitly requested)
- cUSDT balances

### What Is Public

- That a bet transaction occurred
- Market metadata (title, category, teams, end date)
- Publicly decrypted pool ratios when requested for odds display

### Settlement and Claims

- Oracle services monitor external APIs (API-Sports, PandaScore, CoinGecko) and call `settle(marketId, winner, isCanceled)` when an event concludes
- Winners call `requestClaim` → the contract emits encrypted handles → the Zama gateway decrypts and verifies → `fulfillClaim` distributes proportional encrypted cUSDT payouts
- Early exit is supported via `requestExitPosition` / `fulfillExitPosition` (1% fee)

---

## Market Types

| Category                 | Source                         |
| ------------------------ | ------------------------------ |
| Football / Soccer        | API-Sports                     |
| NFL                      | API-Sports                     |
| Formula 1                | API-Sports                     |
| Esports                  | PandaScore                     |
| Crypto                   | CoinGecko                      |
| Politics                 | Curated definitions            |
| Tech / Finance / Culture | Curated definitions            |
| Creator Markets          | User-submitted, admin-reviewed |

---

## Tech Stack

**Smart Contracts**

- Solidity `^0.8.27` with `fhevm-solidity v0.11.1`
- Foundry (build, test, deploy)
- Soldeer (dependency management)
- OpenZeppelin Confidential Contracts

**Frontend**

- Next.js 15 (App Router)
- wagmi v2 + viem
- RainbowKit
- `@zama-fhe/react-sdk` + `@zama-fhe/sdk`
- Supabase JS (realtime market + notification sync)
- Tailwind CSS + DaisyUI

**Backend**

- Node.js REST + WebSocket API
- SIWE (Sign-In With Ethereum) authentication
- Supabase (markets, comments, profiles, notifications)
- Railway (hosting)

**Oracles**

- Node.js polling services with exponential backoff
- One service per market category
- Writes on-chain + Supabase metadata atomically

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)

### Install

```bash
git clone https://github.com/Ollie202/DarkONNET
cd DarkONNET
pnpm install
cd packages/foundry && forge soldeer install
```

### Run the frontend

```bash
# Copy and fill in your keys
cp packages/nextjs/.env.example packages/nextjs/.env.local

pnpm --filter ./packages/nextjs dev
# → http://localhost:3000
```

### Required environment variables

```bash
# packages/nextjs/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_INFURA_API_KEY=           # optional in dev, required in prod
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID= # optional
```

### Build and test contracts

```bash
cd packages/foundry
forge build --sizes
forge test -vv
```

---

## CI

Every pull request and push to `main` runs:

- `forge build` + `forge test`
- TypeScript typecheck
- ESLint
- `next build`
- Prettier format check
- gitleaks secret scan

---

## Team

- **Ollie** — Product, frontend, contracts
- **TmDefi** — Backend API, oracle services, Supabase integration

---

## License

MIT
