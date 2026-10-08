import EntityActions from "@/components/EntityActions";
import LookupError from "@/components/LookupError";
import { notFound } from "next/navigation";
import { isAddress } from "@/lib/format";
import AppHeader from "@/components/AppHeader";
import TransactionList from "@/components/TransactionList";
import {
  getAddress,
  getAddressTransactions,
  type AddressResponse,
  type AddressTransactionsResponse,
} from "@/lib/api";

type Props = {
  params: Promise<{
    address: string;
  }>;
};

export default async function AddressPage({ params }: Props) {
  const { address } = await params;
  if (!isAddress(address)) notFound();

  let data: AddressResponse | null = null;
  let transactionData: AddressTransactionsResponse | null = null;
  let loadError = false;

  try {
    [data, transactionData] = await Promise.all([
      getAddress(address),
      getAddressTransactions(address),
    ]);
  } catch {
    loadError = true;
  }

  if (loadError || !data || !transactionData) {
    return (
      <main className="detail-page">
        <AppHeader />
        <div className="page-content">
          <EntityActions target={address} />
          <LookupError type="address" target={address} />
        </div>
      </main>
    );
  }

  const label = data.label?.label ?? data.address.label;
  const chain =
    data.address.chain_id === 1 ? "Ethereum" : `Chain ${data.address.chain_id}`;

  return (
    <main className="detail-page">
      <AppHeader subtitle="Address investigation" />

      <div className="page-content">
        <EntityActions target={address} />
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Address
            </span>
            {label && (
              <span className="rounded bg-gray-900 px-2 py-0.5 text-xs text-white">
                {label}
              </span>
            )}
            <span className="text-xs text-gray-400">{chain}</span>
          </div>

          <h1 className="mt-3 break-all font-mono text-base sm:text-lg">
            {address}
          </h1>

          {data.label && (
            <p className="mt-2 text-xs text-gray-500">
              Label source: {data.label.source}
              {data.label.confidence
                ? ` · confidence ${data.label.confidence}`
                : ""}
            </p>
          )}
        </div>

        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-gray-500">
              {transactionData.message}
            </p>
          </div>

          <TransactionList
            address={address}
            transactions={transactionData.transactions}
          />
        </section>
      </div>
    </main>
  );
}
