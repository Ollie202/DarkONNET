# DarkONNET

DarkONNET is a private prediction market demo built for the Zama Developer Program Builder Track. The app presents public real-world markets while keeping user prediction side, stake, and wallet-owned account activity private through the Zama FHE stack.

The current frontend is ready for backend/smart-contract integration. It uses mocked market data and local browser storage for demo-only flows, while preserving the wallet boundaries and UI states that the production contracts should drive.

## Builder Track Fit

- **Functioning dApp demo using Zama Protocol:** The repo includes Zama FHE provider wiring, Sepolia runtime configuration, and the reference `FHECounter` contract/frontend path for encrypted input, encrypted storage handles, and user decrypt flow.
- **Real-world FHE use case:** DarkONNET models confidential prediction markets where users can browse markets publicly but keep positions, stake size, side, and creator/account data wallet-scoped.
- **Smart contract + frontend:** The repo has Foundry contracts under `packages/foundry` and a Next.js frontend under `packages/nextjs`.
- **Documentation:** This README and `docs/BACKEND_HANDOFF.md` document the demo scope, routes, wallet boundaries, token assumptions, and contract integration points.
- **Deployment target:** Frontend and contracts are structured for Sepolia. The UI assumes an encrypted Sepolia test token named `cUSDT`.

## What Is Frontend-Ready

- Public market browsing without wallet connection.
- Wallet-gated prediction submission.
- Wallet-gated `My Positions`.
- Public profile shell with blank disconnected state.
- Wallet-gated profile editing.
- Public creator market browsing.
- Wallet-gated `My Markets`.
- Creator market request form with wallet-gated submission.
- Admin review UI for accepting/declining creator market requests.
- Private-market comments/replies UX.
- Notifications menu and read/unread states.
- Dark/light theme, responsive shell, fixed sidebar, mobile bottom nav.
- DarkONNET branding, favicon, and cUSDT token display.

## Demo Routes

| Route                    | Purpose                                                 | Wallet behavior                                        |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------ |
| `/`                      | Public platform markets                                 | Browse without wallet                                  |
| `/markets/[id]`          | Full market detail and prediction panel                 | Browse without wallet; prediction requires wallet      |
| `/creator-markets`       | Public creator markets and wallet-owned creator markets | `Creator Markets` public; `My Markets` requires wallet |
| `/create-market`         | Creator market request form                             | View form without wallet; submit requires wallet       |
| `/positions`             | Wallet-owned positions                                  | Requires wallet                                        |
| `/profile`               | Wallet-owned profile settings                           | Blank state without wallet; edit requires wallet       |
| `/admin-market-requests` | Demo admin review panel                                 | Prototype passphrase gate only; backend auth required  |
| `/fhe-counter`           | Reference Zama FHE counter flow                         | Requires wallet and deployed FHECounter                |

## Token Assumption

The frontend uses one platform token:

```ts
// packages/nextjs/lib/token.ts
PLATFORM_TOKEN_SYMBOL = "cUSDT";
DEFAULT_TOKEN_BALANCE = 0;
```

The backend/contracts should replace the mocked balance with the real encrypted Sepolia `cUSDT` balance and wire the faucet/registry flow.

## Local Development

```bash
pnpm install
pnpm contracts:install
pnpm start
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
pnpm next:lint
pnpm next:check-types
pnpm contracts:build
pnpm contracts:test
```

## Sepolia Setup

Create `.env.local` at the repo root:

```bash
DEPLOYER_PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=...
```

Create `packages/nextjs/.env.local`:

```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_KEY
```

Deploy reference contract:

```bash
pnpm deploy:sepolia
pnpm start
```

## Current Contract State

The repo still contains the template `FHECounter` reference contract. It proves the Zama integration path, but the final Builder Track submission should replace or extend it with DarkONNET prediction market contracts.

Minimum contract work still needed:

- Encrypted cUSDT token balance/deposit/faucet integration.
- Confidential market position storage.
- Encrypted bet amount and side submission.
- Confidential position close/settlement logic.
- Public aggregate market price/volume updates that do not reveal individual holders.
- Creator market request lifecycle and admin authorization.
- Creator fee routing.
- Sepolia deployment artifacts regenerated into `packages/nextjs/contracts`.

See `docs/BACKEND_HANDOFF.md` for the exact frontend integration points.

## Video Demo Notes

The 3-minute real-person demo should show:

1. Public market browsing without wallet.
2. Wallet connect and username setup.
3. cUSDT balance/faucet assumption.
4. Opening a market and selecting Yes/No.
5. Explaining that side and stake are encrypted with Zama FHE.
6. My Positions gated by wallet.
7. Creator market request and admin review.
8. Why confidential prediction markets are a real-world FHE use case.

## Stack

- Next.js 15, React 19, Tailwind, daisyUI
- wagmi, viem, RainbowKit
- Zama `@zama-fhe/sdk` and `@zama-fhe/react-sdk`
- Foundry and `forge-fhevm`

## License

BSD-3-Clause-Clear. See [LICENSE](LICENSE).
