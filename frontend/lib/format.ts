export function shortAddress(value: string, start = 8, end = 6) {
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function formatEth(value: string) {
  try {
    const wei = BigInt(value.startsWith("0x") ? value : value);
    const base = BigInt(10) ** BigInt(18);
    const whole = wei / base;
    const fraction = (wei % base)
      .toString()
      .padStart(18, "0")
      .replace(/0+$/, "");

    return fraction ? `${whole}.${fraction}` : `${whole}`;
  } catch {
    return value;
  }
}

export function hexToNumber(value: string) {
  return Number.parseInt(value.replace(/^0x/, ""), 16);
}

export function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function isTxHash(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}
