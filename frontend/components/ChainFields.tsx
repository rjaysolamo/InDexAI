"use client";
import { useId } from "react";
import { CHAINS, CHAIN_NAMES, type Chain, type LookupKind } from "@/lib/chains";
export default function ChainFields({
  chain,
  kind,
  onChain,
  onKind,
}: {
  chain: Chain;
  kind: LookupKind;
  onChain: (chain: Chain) => void;
  onKind: (kind: LookupKind) => void;
}) {
  const id = useId();
  return (
    <div className="chain-fields">
      <label htmlFor={`${id}-chain`}>Chain</label>
      <select
        id={`${id}-chain`}
        value={chain}
        onChange={(e) => onChain(e.target.value as Chain)}
      >
        {CHAINS.map((c) => (
          <option key={c} value={c}>
            {CHAIN_NAMES[c]}
          </option>
        ))}
      </select>
      {chain !== "ethereum" && (
        <>
          <label htmlFor={`${id}-kind`}>Look up</label>
          <select
            id={`${id}-kind`}
            value={kind}
            onChange={(e) => onKind(e.target.value as LookupKind)}
          >
            <option value="address">Address</option>
            <option value="transaction">Transaction</option>
          </select>
        </>
      )}
    </div>
  );
}
