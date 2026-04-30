# DarkONNET Backend Handoff

This document is for the backend/smart-contract engineer taking over the frontend prototype.

## Current Frontend Contract

The UI is intentionally browse-first:

- Anyone can view public markets.
- Wallet is required for account-owned actions.
- Demo data is currently local/mock data.
- cUSDT balance is currently a constant set to `0`.

Shared token config lives in `packages/nextjs/lib/token.ts`.

Replace `DEFAULT_TOKEN_BALANCE` with real balance state once the encrypted token integration exists.

## Data To Replace

### Public Markets

Current files:

- `packages/nextjs/lib/mockMarkets.ts`
- `packages/nextjs/components/markets/MarketGrid.tsx`
- `packages/nextjs/components/markets/MarketCard.tsx`

Backend should provide:

- market id
- question
- category
- image URL
- close/resolution timestamp
- public price/odds
- public total volume
- public sentiment/metadata
- creator market status

Do not expose:

- individual holders
- exact wallet positions
- biggest holders
- user side selection
- user stake

### Market Detail And Prediction

Current file:

- `packages/nextjs/components/markets/MarketDetail.tsx`

Replace local `reviewBet` behavior with contract calls:

1. Require wallet connection.
2. Encrypt selected side.
3. Encrypt cUSDT amount.
4. Approve/transfer encrypted cUSDT as required by contract design.
5. Submit encrypted prediction to the market contract.
6. Refresh public market price/volume.
7. Refresh wallet-owned position state.

Frontend already has the UX states for:

- no option selected
- amount presets
- manual amount input
- insufficient balance
- creator fee
- connect wallet prompt
- estimated shares

### Positions

Current files:

- `packages/nextjs/app/positions/page.tsx`
- `packages/nextjs/lib/localPositions.ts`

Backend should provide wallet-scoped:

- open positions
- closed positions
- completed/settled positions
- entry price
- current price
- PNL
- close trade action

Disconnected users should keep seeing the connect prompt.

### Profile

Current files:

- `packages/nextjs/app/profile/page.tsx`
- `packages/nextjs/components/profile/ProfileContext.tsx`

Backend should persist by wallet:

- username
- optional email
- notification preferences
- profile picture URL/data reference

Important rule: usernames should be used in comments and UI. Wallet address should not leak as username after a profile exists.

### Creator Markets

Current files:

- `packages/nextjs/app/create-market/page.tsx`
- `packages/nextjs/app/creator-markets/page.tsx`
- `packages/nextjs/lib/localMarkets.ts`

Backend should replace local storage with:

- submit creator market request
- enforce one request per wallet/profile per 24 hours
- require minimum 1 cUSDT creator stake
- store sources, rules, dates, category, and image
- track accepted/declined/pending states
- expose `My Markets` only for connected wallet
- hide creator identity from public/admin views if privacy is required

### Admin Review

Current file:

- `packages/nextjs/app/admin-market-requests/page.tsx`

Prototype passphrase is not secure. Replace it with backend auth.

Admin needs:

- pending requests
- accept request
- decline request
- rejection note
- reviewed markets
- monitoring accepted creator markets

## Suggested Contract Modules

These names are suggestions, not requirements:

- `ConfidentialPredictionMarketFactory`
- `ConfidentialPredictionMarket`
- `ConfidentialPositionBook`
- `ConfidentialCUSDTVault`
- `CreatorMarketRegistry`
- `AdminMarketReview`

## Zama/FHE Requirements To Preserve

Private/encrypted:

- user prediction side
- user stake amount
- individual position size
- wallet-owned position records

Public/aggregate:

- market question/category/image
- market status
- odds/price
- total volume
- close/resolution time
- accepted/declined creator status

## Frontend Integration Checklist

- Replace mocks in `mockMarkets.ts` with API/contract reads.
- Replace `localMarkets.ts` local storage with backend/contract calls.
- Replace `localPositions.ts` local storage with backend/contract calls.
- Replace `DEFAULT_TOKEN_BALANCE` with live encrypted cUSDT balance.
- Wire `reviewBet` to encrypted submit transaction.
- Wire `Close Trade` to contract transaction.
- Wire admin accept/decline to authenticated backend or admin contract.
- Regenerate contract ABI files after deployment.
- Update README with deployed Sepolia addresses.

## Demo Safety

Do not ship the current admin passphrase as production security. The admin page is suitable for judging/demo only until real auth is added.
