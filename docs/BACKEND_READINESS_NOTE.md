# DarkONNET Backend Readiness Note

DarkONNET is ready for backend and smart contract integration.

The frontend should now be treated as the completed product shell. The backend developer should plug in the real token logic, smart contracts, oracle setup, live market data, and settlement logic.

## What Is Ready

Frontend-ready areas:

- Public market browsing without wallet connection.
- Wallet-gated prediction flow.
- Wallet-gated `My Positions`.
- Public creator market browsing.
- Wallet-gated `My Markets`.
- Creator market request flow.
- Admin market request review screen.
- Profile and username flow.
- Profile picture support.
- Comments, replies, likes, and notifications.
- Dark/light theme.
- Mobile responsive layout.
- DarkONNET branding.
- Sepolia-first wallet flow.
- cUSDT display as the platform currency.

The UI is ready for live data and real transaction wiring.

## What The Backend Developer Should Replace

The current frontend still uses mock/local demo state in these areas:

- Market list data.
- Creator market requests.
- Admin accept/decline state.
- User positions.
- User profile persistence.
- cUSDT balance.
- Prediction placement.
- Close trade.
- Market settlement.
- Creator fee routing.

These should be replaced with real backend, smart contract, token, and oracle calls.

## Token Logic

The platform token is:

```txt
cUSDT on Sepolia
```

For now, the frontend only displays cUSDT. The backend/smart contract developer should implement:

- Real cUSDT token deployment or registry integration.
- Faucet flow.
- Wallet balance reads.
- Encrypted balance handling where required.
- Token approval/deposit flow.
- Prediction funding flow.
- Creator stake funding flow.

## Oracle Integration

The backend developer's oracle setup should power:

- Live market data.
- Market status updates.
- Final outcome resolution.
- Settlement triggers.
- Public volume updates.
- Public odds/price updates.
- Accepted creator markets becoming live working markets.

The frontend already has the screens for these states. The backend should connect the real data/action layer behind them.

## Important Privacy Rules

Keep these private/encrypted:

- User prediction side.
- User stake amount.
- Individual position size.
- Wallet-owned positions.
- User market activity.

Public data can include:

- Market title.
- Market category.
- Market image.
- Market status.
- Public odds.
- Public total volume.
- Resolution date.
- Creator market approval status.

Do not expose:

- Who picked Yes or No.
- Individual holders.
- Biggest holders.
- Exact wallet positions.
- Creator identity, unless we explicitly choose to make that public later.

## Main Integration Files

Start with these:

- `docs/BACKEND_BRIEF_FOR_DEVELOPER.md`
- `docs/BACKEND_HANDOFF.md`
- `packages/nextjs/lib/mockMarkets.ts`
- `packages/nextjs/lib/localMarkets.ts`
- `packages/nextjs/lib/localPositions.ts`
- `packages/nextjs/lib/token.ts`
- `packages/nextjs/components/markets/MarketDetail.tsx`

## Bottom Line

The frontend is ready for handoff.

The remaining work is backend, smart contract, token, oracle, and Sepolia deployment work. Once those are connected, DarkONNET can become a live working prediction market rather than a local prototype.
