import Link from "next/link";
import type { TokenTransfer, Erc20Transfer } from "@/lib/api";
import { shortAddress } from "@/lib/format";

export default function TransferTable({
  transfers,
}: {
  transfers: (TokenTransfer | Erc20Transfer)[];
}) {
  if (!transfers.length)
    return <p className="muted">No ERC-20 transfers found.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {["Transaction / log", "Token", "From", "To", "Amount"].map(
              (title) => (
                <th className="p-3" key={title}>
                  {title}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => {
            const scanned = "transaction_hash" in transfer;
            const hash = scanned ? transfer.transaction_hash : transfer.tx_hash;
            return (
              <tr
                key={`${hash}:${transfer.log_index}`}
                className="border-t border-gray-100"
              >
                <td className="p-3">
                  <Link href={`/transaction/${hash}`} className="text-link">
                    {shortAddress(hash)}
                  </Link>
                  <small className="block muted">
                    Log {transfer.log_index}
                    {scanned ? ` · Block ${transfer.block_number}` : ""}
                  </small>
                </td>
                <td className="p-3">
                  <Link
                    href={`/address/${transfer.token_address}`}
                    title={transfer.token_address}
                    className="text-link"
                  >
                    {scanned
                      ? transfer.symbol
                      : shortAddress(transfer.token_address)}
                  </Link>
                </td>
                <td className="p-3">
                  <Link
                    href={`/address/${transfer.from_address}`}
                    title={transfer.from_address}
                    className="text-link"
                  >
                    {shortAddress(transfer.from_address)}
                  </Link>
                </td>
                <td className="p-3">
                  <Link
                    href={`/address/${transfer.to_address}`}
                    title={transfer.to_address}
                    className="text-link"
                  >
                    {shortAddress(transfer.to_address)}
                  </Link>
                </td>
                <td className="p-3 font-mono break-all">
                  {scanned ? transfer.human_amount : transfer.amount}
                  {!scanned && (
                    <small className="block muted">raw base units</small>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
