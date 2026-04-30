export const PLATFORM_TOKEN_SYMBOL = "cUSDT";
export const PLATFORM_TOKEN_LABEL = `${PLATFORM_TOKEN_SYMBOL} on Sepolia`;
export const DEFAULT_TOKEN_BALANCE = 0;

export const formatPlatformToken = (value: number) =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: value >= 1 ? 2 : 4 })} ${PLATFORM_TOKEN_SYMBOL}`;
