import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import EntityActions from "@/components/EntityActions";
import { getChainLookup, ApiError } from "@/lib/api";
import {
  CHAIN_NAMES,
  isChain,
  validIdentifier,
  targetHref,
} from "@/lib/chains";
import { shortAddress } from "@/lib/format";
export default async function ChainLookupPage({
  params,
}: {
  params: Promise<{ chain: string; kind: string; target: string }>;
}) {
  const { chain, kind, target } = await params;
  if (
    !isChain(chain) ||
    (kind !== "address" && kind !== "transaction") ||
    !validIdentifier(chain, kind, target)
  )
    notFound();
  if (chain === "ethereum") redirect(`/${kind}/${target}`);
  const evidence = `${chain}:${kind}:${target}`;
  let data;
  let error = "";
  try {
    data = await getChainLookup(chain, kind, target);
  } catch (cause) {
    error =
      cause instanceof ApiError
        ? cause.message
        : "Chain data could not be loaded. Please try again.";
  }
  return (
    <main>
      <AppHeader subtitle={`${CHAIN_NAMES[chain]} ${kind}`} chain={chain} />
      <div className="page-content">
        <EntityActions target={evidence} />
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              {CHAIN_NAMES[chain]} · {kind}
            </p>
            <h1 className="break-all font-mono text-base">{target}</h1>
          </div>
        </div>
        {error ? (
          <section className="panel panel-body" role="alert">
            <h2>Unable to load {kind}</h2>
            <p className="muted my-3">{error}</p>
            <a href={targetHref(evidence)} className="button secondary">
              Try again
            </a>
            <Link href="/chains" className="text-link ml-4">
              Connection status
            </Link>
          </section>
        ) : (
          data && (
            <>
              <section className="panel mb-6">
                <div className="panel-heading">
                  <h2>Public {kind} details</h2>
                </div>
                <dl className="panel-body divide-y divide-gray-100">
                  {data.fields.map((field) => (
                    <div
                      className="grid gap-2 py-3 sm:grid-cols-[200px_1fr]"
                      key={field.label}
                    >
                      <dt className="muted">{field.label}</dt>
                      <dd className="break-all">{field.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section className="panel panel-body mb-6">
                <h2>Coverage</h2>
                {data.notices.map((notice) => (
                  <p key={notice} className="muted mt-2">
                    {notice}
                  </p>
                ))}
              </section>
              {kind === "address" && !["monero", "zcash"].includes(chain) && (
                <section className="panel mb-6">
                  <div className="panel-heading">
                    <h2>
                      {chain === "sui" || chain === "aptos"
                        ? "Sent transactions"
                        : "Recent transactions"}
                    </h2>
                  </div>
                  <div className="panel-body overflow-x-auto">
                    {data.transactions.length ? (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr>
                            <th className="p-3">Transaction</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">
                              {chain === "solana"
                                ? "Slot"
                                : chain === "sui"
                                  ? "Checkpoint"
                                  : chain === "aptos"
                                    ? "Version"
                                    : "Block"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.transactions.map((tx) => (
                            <tr
                              className="border-t border-gray-100"
                              key={tx.hash}
                            >
                              <td className="p-3">
                                <Link
                                  href={targetHref(
                                    `${chain}:transaction:${tx.hash}`,
                                  )}
                                  title={tx.hash}
                                  className="text-link font-mono"
                                >
                                  {shortAddress(tx.hash)}
                                </Link>
                              </td>
                              <td className="p-3">{tx.status}</td>
                              <td className="p-3">{tx.position}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="muted">
                        No transactions to display. See coverage above for
                        provider and history limits.
                      </p>
                    )}
                  </div>
                </section>
              )}
              {data.public_data !== "null" && (
                <details className="panel panel-body">
                  <summary>Inspect public chain data</summary>
                  <pre className="chain-record mt-3">{data.public_data}</pre>
                </details>
              )}
            </>
          )
        )}
      </div>
    </main>
  );
}
