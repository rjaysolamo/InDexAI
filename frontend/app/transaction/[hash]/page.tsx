import TransferTable from "@/components/TransferTable";
import EntityActions from "@/components/EntityActions";
import LookupError from "@/components/LookupError";
import { notFound } from "next/navigation";
import { isTxHash } from "@/lib/format";
import Link from "next/link";

import AppHeader from "@/components/AppHeader";
import FundFlow from "@/components/FundFlow";
import { getFundFlow, getLogs, getTransaction } from "@/lib/api";
import { formatEth, hexToNumber, shortAddress } from "@/lib/format";

type Props = {
  params: Promise<{
    hash: string;
  }>;
};

export default async function TransactionPage({ params }: Props) {
  const { hash } = await params;
  if (!isTxHash(hash)) notFound();

  const [transactionResult, flowResult, logsResult] = await Promise.allSettled([
    getTransaction(hash),
    getFundFlow(hash),
    getLogs(hash),
  ]);
  const transactionData =
    transactionResult.status === "fulfilled" ? transactionResult.value : null;
  const fundFlowData =
    flowResult.status === "fulfilled" ? flowResult.value : null;
  const logsData = logsResult.status === "fulfilled" ? logsResult.value : null;
  if (!transactionData) {
    return (
      <main className="detail-page">
        <AppHeader />
        <div className="page-content">
          <EntityActions target={hash} />
          <LookupError type="transaction" target={hash} />
        </div>
      </main>
    );
  }

  const transaction = transactionData.transaction;

  if (!transaction) {
    return (
      <main className="detail-page">
        <AppHeader subtitle="Transaction investigation" />
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-lg font-semibold">Transaction not found</h1>
          <p className="mt-2 break-all font-mono text-xs text-gray-400">
            {hash}
          </p>
          <p className="mt-3 text-sm text-gray-500">
            {transactionData.message}
          </p>
        </div>
      </main>
    );
  }

  const success = transaction.status === 1;
  const pending = transaction.status === null;

  return (
    <main className="detail-page">
      <AppHeader subtitle="Transaction investigation" />

      <div className="page-content">
        <EntityActions target={hash} />
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Transaction
            </span>
            <span
              className={[
                "rounded px-2 py-0.5 text-xs",
                pending
                  ? "bg-gray-100 text-gray-600"
                  : success
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700",
              ].join(" ")}
            >
              {pending ? "Pending" : success ? "Success" : "Failed"}
            </span>
            <span className="text-xs text-gray-400">
              Block {transaction.block_number ?? "Pending"}
            </span>
          </div>

          <h1 className="mt-3 break-all font-mono text-sm sm:text-base">
            {hash}
          </h1>
        </div>

        <section className="rounded-md border border-gray-200">
          <div className="border-b border-gray-200 px-5 py-3">
            <h2 className="text-sm font-semibold">Details</h2>
          </div>

          <div className="divide-y divide-gray-100">
            <DetailRow
              label="From"
              value={transaction.from_address}
              href={`/address/${transaction.from_address}`}
            />
            <DetailRow
              label="To"
              value={transaction.to_address ?? "Contract creation"}
              href={
                transaction.to_address
                  ? `/address/${transaction.to_address}`
                  : undefined
              }
              mono={Boolean(transaction.to_address)}
            />
            <DetailRow
              label="Value"
              value={`${formatEth(transaction.value)} ETH`}
            />
            <DetailRow
              label="Gas"
              value={hexToNumber(transaction.gas).toLocaleString()}
            />
            <DetailRow
              label="Gas price"
              value={
                transaction.gas_price
                  ? `${hexToNumber(transaction.gas_price).toLocaleString()} wei`
                  : "—"
              }
            />
          </div>
        </section>

        <section className="panel mt-8">
          <div className="panel-heading">
            <h2>Decoded ERC-20 transfers</h2>
          </div>
          <div className="panel-body">
            {logsData ? (
              <TransferTable transfers={logsData.transfers} />
            ) : (
              <p role="status" className="muted">
                {pending
                  ? "Transfers are available after the transaction is mined."
                  : "Transfer logs could not be loaded."}
                {!pending && (
                  <a className="text-link ml-2" href={`/transaction/${hash}`}>
                    Try again
                  </a>
                )}
              </p>
            )}
          </div>
        </section>

        <div className="mt-8">
          {fundFlowData?.fund_flow ? (
            <FundFlow flow={fundFlowData.fund_flow} />
          ) : (
            <section className="rounded-md border border-gray-200 px-5 py-6">
              <h2 className="text-sm font-semibold">Fund flow</h2>
              <p className="mt-2 text-sm text-gray-500">
                {fundFlowData?.message ??
                  (pending
                    ? "Fund flow is available after the transaction is mined."
                    : "Fund flow could not be loaded.")}
                {!pending && !fundFlowData && (
                  <a className="text-link ml-2" href={`/transaction/${hash}`}>
                    Try again
                  </a>
                )}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
  href,
  mono = true,
}: {
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 px-5 py-3.5 sm:grid-cols-[140px_1fr] sm:items-center">
      <div className="text-sm text-gray-500">{label}</div>
      {href ? (
        <Link
          href={href}
          className="break-all font-mono text-sm text-gray-900 hover:underline"
          title={value}
        >
          {shortAddress(value)}
        </Link>
      ) : (
        <div
          className={["break-all text-sm", mono ? "font-mono" : ""].join(" ")}
        >
          {value}
        </div>
      )}
    </div>
  );
}
