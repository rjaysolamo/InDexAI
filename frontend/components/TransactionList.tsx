"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { AddressTransaction } from "@/lib/api";
import { shortAddress } from "@/lib/format";

type Props = {
  address: string;
  transactions: AddressTransaction[];
};

type Filter = "ALL" | "IN" | "OUT";

export default function TransactionList({
  address,
  transactions,
}: Props) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;
    for (const tx of transactions) {
      if (tx.direction === "IN") incoming += 1;
      if (tx.direction === "OUT") outgoing += 1;
    }
    return { incoming, outgoing, total: transactions.length };
  }, [transactions]);

  const filtered =
    filter === "ALL"
      ? transactions
      : transactions.filter((tx) => tx.direction === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-xs text-gray-500">
          <span>
            <span className="font-medium text-gray-900">{counts.total}</span>{" "}
            total
          </span>
          <span>
            <span className="font-medium text-emerald-700">
              {counts.incoming}
            </span>{" "}
            in
          </span>
          <span>
            <span className="font-medium text-red-600">
              {counts.outgoing}
            </span>{" "}
            out
          </span>
        </div>

        <div className="flex gap-1">
          {(["ALL", "IN", "OUT"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={[
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                filter === option
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-gray-200 px-5 py-8 text-center text-sm text-gray-500">
          No {filter === "ALL" ? "" : `${filter.toLowerCase()} `}
          transactions found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Dir</th>
                <th className="px-4 py-2.5 font-medium">Hash</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">
                  Counterparty
                </th>
                <th className="px-4 py-2.5 font-medium">Asset</th>
                <th className="px-4 py-2.5 font-medium text-right">Value</th>
                <th className="hidden px-4 py-2.5 font-medium text-right sm:table-cell">
                  Block
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((tx) => {
                const counterparty =
                  tx.direction === "IN"
                    ? tx.from_address
                    : tx.to_address;

                return (
                  <tr key={tx.hash} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                          tx.direction === "IN"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700",
                        ].join(" ")}
                      >
                        {tx.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/transaction/${tx.hash}`}
                        className="font-mono text-xs hover:underline"
                        title={tx.hash}
                      >
                        {shortAddress(tx.hash)}
                      </Link>
                      {tx.category && (
                        <div className="mt-0.5 text-[11px] text-gray-400">
                          {tx.category}
                        </div>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {counterparty ? (
                        <Link
                          href={`/address/${counterparty}`}
                          className="font-mono text-xs text-gray-600 hover:underline"
                          title={counterparty}
                        >
                          {shortAddress(counterparty)}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Contract creation
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {tx.asset ?? "ETH"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {tx.value}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs text-gray-500 sm:table-cell">
                      {tx.block_number ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-400">
        Activity relative to {shortAddress(address)}
      </p>
    </div>
  );
}
