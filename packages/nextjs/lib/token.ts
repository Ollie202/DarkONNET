export const PLATFORM_TOKEN_SYMBOL = "cUSDT";
export const PLATFORM_TOKEN_LABEL = `${PLATFORM_TOKEN_SYMBOL} on Sepolia`;
export const DEFAULT_TOKEN_BALANCE = 0;

export const formatPlatformToken = (value: number) =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: value >= 1 ? 2 : 4 })} ${PLATFORM_TOKEN_SYMBOL}`;

export const formatPlatformTokenUnits = (units: bigint, decimals = 6) => {
  const scale = 10n ** BigInt(decimals);
  const whole = units / scale;
  const fraction = units % scale;
  if (fraction === 0n) return `${whole.toLocaleString()} ${PLATFORM_TOKEN_SYMBOL}`;

  const maxFractionDigits = whole >= 1n ? 2 : 4;
  const fractionText = fraction.toString().padStart(decimals, "0").slice(0, maxFractionDigits).replace(/0+$/, "");

  return `${whole.toLocaleString()}${fractionText ? `.${fractionText}` : ""} ${PLATFORM_TOKEN_SYMBOL}`;
};
