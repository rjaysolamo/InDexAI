"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getChains, getChainStatus, type ChainConnection } from "@/lib/api";

export default function ChainConnections() {
  const [chains, setChains] = useState<ChainConnection[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const connections = await getChains();
        if (!active) return;
        setChains(connections);
        await Promise.all(
          connections.map(async (chain) => {
            let status = "Not configured";
            if (chain.configured) {
              try {
                const data = await getChainStatus(chain.chain);
                status = `Connected · Latest ${chain.chain === "solana" ? "slot" : chain.chain === "sui" ? "checkpoint" : chain.chain === "aptos" ? "version" : "height"}: ${data.position}`;
              } catch {
                status = "Provider unavailable — retry connection";
              }
            }
            if (active)
              setStatuses((previous) => ({
                ...previous,
                [chain.chain]: status,
              }));
          }),
        );
      } catch {
        if (active)
          setError("Chain connections could not be loaded. Please try again.");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <>
      <button
        className="button secondary mb-4"
        onClick={() => {
          setError("");
          setStatuses({});
          setAttempt((value) => value + 1);
        }}
      >
        Refresh connections
      </button>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {!chains.length && !error && <p role="status">Loading connections…</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {chains.map((chain) => (
          <section className="panel panel-body chain-card" key={chain.chain}>
            <h2>{chain.name}</h2>
            <p role="status" className="muted">
              {statuses[chain.chain] ?? "Checking connection…"}
            </p>
            <p>{chain.notice}</p>
            <Link className="button secondary" href={`/chain/${chain.chain}`}>
              Explore {chain.name}
            </Link>
          </section>
        ))}
      </div>
      <p className="muted mt-4">
        Default public connections use mainnet. Provider availability and
        retained history vary. Ethereum remains available in search and the
        Ethereum indexer.
      </p>
    </>
  );
}
