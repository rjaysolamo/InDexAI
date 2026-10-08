export const CHAINS = [
  "ethereum",
  "solana",
  "sui",
  "aptos",
  "bitcoin",
  "zcash",
  "monero",
] as const;
export type Chain = (typeof CHAINS)[number];
export type LookupKind = "address" | "transaction";
export type Target = { chain: Chain; kind: LookupKind; value: string };
export const CHAIN_NAMES: Record<Chain, string> = {
  ethereum: "Ethereum",
  solana: "Solana",
  sui: "Sui",
  aptos: "Aptos",
  bitcoin: "Bitcoin",
  zcash: "Zcash",
  monero: "Monero",
};
export function isChain(value: string): value is Chain {
  return CHAINS.some((chain) => chain === value);
}
function base58Size(value: string, bytes: number) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  if (!value || value.length > 88) return false;
  let number = BigInt(0);
  for (const char of value) {
    const digit = alphabet.indexOf(char);
    if (digit < 0) return false;
    number = number * BigInt(58) + BigInt(digit);
  }
  const leadingZeros = value.match(/^1*/)?.[0].length ?? 0;
  return (
    leadingZeros +
      (number === BigInt(0) ? 0 : Math.ceil(number.toString(16).length / 2)) ===
    bytes
  );
}
// Format checks, not ownership or checksum verification. Providers validate lookups.
export function validIdentifier(
  chain: Chain,
  kind: LookupKind,
  value: string,
): boolean {
  if (!value || value.length > 1024) return false;
  if (kind === "transaction") {
    if (chain === "solana") return base58Size(value, 64);
    if (chain === "sui") return base58Size(value, 32);
    return chain === "ethereum" || chain === "aptos"
      ? /^0x[\da-fA-F]{64}$/.test(value)
      : /^[\da-fA-F]{64}$/.test(value);
  }
  switch (chain) {
    case "ethereum":
      return /^0x[\da-fA-F]{40}$/.test(value);
    case "solana":
      return base58Size(value, 32);
    case "sui":
    case "aptos":
      return /^0x[\da-fA-F]{1,64}$/.test(value);
    case "bitcoin":
      return (
        /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(value) ||
        /^bc1[023456789acdefghjklmnpqrstuvwxyz]{11,87}$/.test(value)
      );
    case "zcash":
      return /^(?:t[13][1-9A-HJ-NP-Za-km-z]{33}|zc[1-9A-HJ-NP-Za-km-z]{93}|zs[023456789acdefghjklmnpqrstuvwxyz]{76}|u1[023456789acdefghjklmnpqrstuvwxyz]{18,1022})$/.test(
        value,
      );
    case "monero":
      return /^[48](?:[1-9A-HJ-NP-Za-km-z]{94}|[1-9A-HJ-NP-Za-km-z]{105})$/.test(
        value,
      );
  }
}
export function makeTarget(
  chain: Chain,
  kind: LookupKind,
  input: string,
): string | null {
  const value = input.trim();
  const resolvedKind =
    chain === "ethereum"
      ? /^0x[\da-fA-F]{64}$/.test(value)
        ? "transaction"
        : "address"
      : kind;
  if (!validIdentifier(chain, resolvedKind, value)) return null;
  return chain === "ethereum" ? value : `${chain}:${resolvedKind}:${value}`;
}
export function parseTarget(target: string): Target | null {
  if (!target.includes(":")) {
    for (const kind of ["address", "transaction"] as const) {
      if (validIdentifier("ethereum", kind, target))
        return { chain: "ethereum", kind, value: target };
    }
    return null;
  }
  const parts = target.split(":");
  const [chain, kind, value] = parts;
  if (
    parts.length !== 3 ||
    !isChain(chain) ||
    (kind !== "address" && kind !== "transaction") ||
    !validIdentifier(chain, kind, value)
  )
    return null;
  return { chain, kind, value };
}
export function targetKey(target: string) {
  const parsed = parseTarget(target);
  if (!parsed) return target;
  let value = parsed.value;
  if (
    ["ethereum", "sui", "aptos"].includes(parsed.chain) &&
    value.startsWith("0x")
  ) {
    value = value.toLowerCase();
    if (parsed.chain !== "ethereum" && parsed.kind === "address")
      value = `0x${value.slice(2).padStart(64, "0")}`;
  } else if (
    parsed.kind === "transaction" &&
    parsed.chain !== "solana" &&
    parsed.chain !== "sui"
  )
    value = value.toLowerCase();
  return `${parsed.chain}:${parsed.kind}:${value}`;
}
export function targetHref(target: string) {
  const parsed = parseTarget(target);
  if (!parsed) return "/";
  return parsed.chain === "ethereum"
    ? `/${parsed.kind}/${encodeURIComponent(parsed.value)}`
    : `/chain/${parsed.chain}/${parsed.kind}/${encodeURIComponent(parsed.value)}`;
}
export function targetLabel(target: string) {
  const parsed = parseTarget(target);
  return parsed
    ? `${CHAIN_NAMES[parsed.chain]} ${parsed.kind}`
    : "Unknown target";
}
