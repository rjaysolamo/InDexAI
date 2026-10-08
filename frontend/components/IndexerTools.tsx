"use client";
import { useState, type FormEvent } from "react";
import {
  getBlock,
  scanErc20,
  type BlockResponse,
  type ScanResponse,
} from "@/lib/api";
import TransferTable from "@/components/TransferTable";

function blockNumber(value: string, minimum: number) {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < minimum)
    throw new Error(`Enter a whole block number of at least ${minimum}.`);
  return number;
}
export default function IndexerTools() {
  const [block, setBlock] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [blockResult, setBlockResult] = useState<BlockResponse | null>(null);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [blockError, setBlockError] = useState("");
  const [scanError, setScanError] = useState("");
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [scanning, setScanning] = useState(false);
  async function submitBlock(event: FormEvent) {
    event.preventDefault();
    setBlockError("");
    setBlockResult(null);
    setLoadingBlock(true);
    try {
      setBlockResult(await getBlock(blockNumber(block, 1)));
    } catch (error) {
      setBlockError(
        error instanceof Error ? error.message : "Block request failed.",
      );
    } finally {
      setLoadingBlock(false);
    }
  }
  async function submitScan(event: FormEvent) {
    event.preventDefault();
    setScanError("");
    setScanResult(null);
    setScanning(true);
    try {
      const start = blockNumber(from, 0),
        end = blockNumber(to, 0);
      if (start > end || end - start >= 100)
        throw new Error("Choose an ordered range of at most 100 blocks.");
      setScanResult(await scanErc20(start, end));
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Transfer scan failed.",
      );
    } finally {
      setScanning(false);
    }
  }
  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="panel-heading">
          <h2>Scan ERC-20 transfers</h2>
        </div>
        <div className="panel-body">
          <p className="muted mb-4">
            Find token transfers in an Ethereum block range. Scan up to 100
            blocks at a time; busy ranges may require smaller scans.
          </p>
          <form
            onSubmit={submitScan}
            className="space-y-3"
            aria-busy={scanning}
          >
            <label className="input-label" htmlFor="scan-from">
              From block
            </label>
            <input
              id="scan-from"
              className="text-input"
              inputMode="numeric"
              required
              value={from}
              disabled={scanning}
              onChange={(e) => setFrom(e.target.value)}
            />
            <label className="input-label" htmlFor="scan-to">
              To block (inclusive)
            </label>
            <input
              id="scan-to"
              className="text-input"
              inputMode="numeric"
              required
              value={to}
              disabled={scanning}
              onChange={(e) => setTo(e.target.value)}
            />
            <button className="button primary" disabled={scanning}>
              {scanning ? "Scanning transfers…" : "Scan transfers"}
            </button>
          </form>
          {scanError && (
            <p className="field-error" role="alert">
              {scanError}
            </p>
          )}
          {scanResult && (
            <div className="mt-4">
              <p role="status" className="muted mb-3">
                Blocks {scanResult.from_block}–{scanResult.to_block} ·{" "}
                {scanResult.transfers.length} transfer(s). {scanResult.message}
              </p>
              <TransferTable transfers={scanResult.transfers} />
            </div>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Block request</h2>
        </div>
        <div className="panel-body">
          <p className="muted mb-4">
            Validate a block request. Block indexing is not implemented yet, so
            this does not retrieve or store block data.
          </p>
          <form onSubmit={submitBlock} aria-busy={loadingBlock}>
            <label className="input-label" htmlFor="block-number">
              Block number
            </label>
            <div className="inline-form">
              <input
                id="block-number"
                className="text-input"
                inputMode="numeric"
                required
                value={block}
                disabled={loadingBlock}
                onChange={(e) => setBlock(e.target.value)}
              />
              <button className="button secondary" disabled={loadingBlock}>
                {loadingBlock ? "Validating…" : "Validate block"}
              </button>
            </div>
          </form>
          {blockError && (
            <p className="field-error" role="alert">
              {blockError}
            </p>
          )}
          {blockResult && (
            <p className="muted mt-3" role="status">
              Block {blockResult.block_number}: {blockResult.message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
