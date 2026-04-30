# DarkONNET Backend Handoff Brief

DarkONNET is a private prediction market dApp frontend built for the Zama Developer Program Builder Track.

The frontend is ready as a polished prototype, but the real Zama/FHE backend and smart contract layer still need to be plugged in. Start with this brief, then use `docs/BACKEND_HANDOFF.md` for the full technical integration map.

## Current Status

The frontend already supports:

- Public market browsing without connecting a wallet.
- Wallet-gated prediction actions.
- Wallet-gated `My Positions`.
- Public creator market browsing.
- Wallet-gated `My Markets`.
- Creator market request form.
- Admin market request review UI.
- Profile page and username/profile picture flow.
- Comments, replies, likes, and notifications.
- Dark/light theme.
- Responsive layout.
- DarkONNET branding.
- Sepolia-first wallet flow.
- Platform token display using `cUSDT`.

The current app still uses mocked/local demo data in several places. Those mock layers need to be replaced with real backend and smart contract calls.

## Main Backend And Contract Work

Replace the template `FHECounter` contract with actual DarkONNET confidential prediction market contracts.

The production contract/backend layer should handle:

- Sepolia deployment.
- Encrypted Sepolia test token integration using `cUSDT`.
- Faucet integration for test cUSDT.
- Confidential prediction submission.
- Confidential position tracking.
- Close trade logic.
- Market settlement.
- Creator market request submission.
- One creator market request per profile/wallet every 24 hours.
- Admin accept/decline flow.
- Admin rejection notes.
- Creator fee routing.
- Public market volume and odds updates.

## Privacy Rules To Preserve

These should stay private/encrypted:

- User prediction side.
- User stake amount.
- Individual position size.
- Wallet-owned position records.
- User market activity.

These can be public:

- Market question.
- Market category.
- Market image.
- Market status.
- Public odds/price.
- Public total volume.
- Close/resolution date.
- Accepted/declined creator market status.

Do not expose:

- Individual holders.
- Biggest holders.
- Exact wallet positions.
- Which users picked Yes or No.
- Creator identity, unless we explicitly decide to make that public later.

## Frontend Integration Points

Use the existing frontend UX and replace only the data/action layer.

Key files:

- `packages/nextjs/lib/mockMarkets.ts`
- `packages/nextjs/lib/localMarkets.ts`
- `packages/nextjs/lib/localPositions.ts`
- `packages/nextjs/lib/token.ts`
- `packages/nextjs/components/markets/MarketDetail.tsx`
- `packages/nextjs/app/create-market/page.tsx`
- `packages/nextjs/app/creator-markets/page.tsx`
- `packages/nextjs/app/positions/page.tsx`
- `packages/nextjs/app/profile/page.tsx`
- `packages/nextjs/app/admin-market-requests/page.tsx`

Important frontend behavior to preserve:

- Users can browse public markets without connecting a wallet.
- Users cannot place predictions without connecting a wallet.
- Users cannot view wallet-owned positions without connecting a wallet.
- Users can view creator markets without connecting a wallet.
- `My Markets` requires wallet connection, but should not auto-open the wallet modal.
- Create market form can be viewed without wallet, but submission requires wallet.
- Profile can be opened without wallet, but user-specific editing requires wallet.
- The platform uses only `cUSDT` for now.

## Zama Builder Track Notes

The project needs to satisfy:

- Functioning dApp demo using the Zama Protocol.
- Real-world FHE use case.
- Smart contract and frontend implementation.
- Clear project documentation.
- Sepolia deployment.
- 3-minute real-person demo video.

The frontend side is ready for demo handoff. The smart contract side is the major remaining requirement before final submission.

## Before Final Submission

Please complete:

- Real confidential prediction market contracts.
- Sepolia deployment.
- ABI/address generation for the frontend.
- Real cUSDT balance and faucet flow.
- Real prediction transaction flow.
- Real close trade and settlement flow.
- Real creator market request storage.
- Real admin auth.
- README update with deployed contract addresses.
- Final end-to-end test on Sepolia.

## Useful Commands

```bash
pnpm install
pnpm start
pnpm next:lint
pnpm next:check-types
pnpm contracts:build
pnpm contracts:test
pnpm deploy:sepolia
```

Note: contract commands require Foundry/Forge to be installed locally.
