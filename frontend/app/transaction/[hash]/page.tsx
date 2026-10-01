import Link from "next/link";

import AppHeader from "@/components/AppHeader";
import FundFlow from "@/components/FundFlow";
import {
  getFundFlow,
  getTransaction,
  type FundFlowResponse,
  type TransactionResponse,
} from "@/lib/api";
import {
  formatEth,
  hexToNumber,
  shortAddress,
} from "@/lib/format";

type Props = {
  params: Promise<{
    hash: string;
  }>;
};

export default async function TransactionPage({ params }: Props) {
  const { hash } = await params;

  let transactionData: TransactionResponse | null = null;
  let fundFlowData: FundFlowResponse | null = null;
  let loadError = false;

  try {
    [transactionData, fundFlowData] = await Promise.all([
      getTransaction(hash),
      getFundFlow(hash),
    ]);
  } catch {
    loadError = true;
  }

  if (loadError || !transactionData || !fundFlowData) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
        <AppHeader />
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-lg font-semibold">Unable to load transaction</h1>
          <p className="mt-2 text-sm text-gray-500">
            Make sure the InDexAI backend is running on the configured API URL.
          </p>
        </div>
      </main>
    );
  }

  const transaction = transactionData.transaction;

  if (!transaction) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
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

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <AppHeader subtitle="Transaction investigation" />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Transaction
            </span>
            <span
              className={[
                "rounded px-2 py-0.5 text-xs",
                success
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700",
              ].join(" ")}
            >
              {success ? "Success" : "Failed"}
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

        <div className="mt-8">
          {fundFlowData.fund_flow ? (
            <FundFlow flow={fundFlowData.fund_flow} />
          ) : (
            <section className="rounded-md border border-gray-200 px-5 py-6">
              <h2 className="text-sm font-semibold">Fund flow</h2>
              <p className="mt-2 text-sm text-gray-500">
                {fundFlowData.message}
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
