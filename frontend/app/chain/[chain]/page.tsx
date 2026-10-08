import { notFound, redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import { isChain, CHAIN_NAMES } from "@/lib/chains";
import Link from "next/link";
export default async function ChainPage({
  params,
}: {
  params: Promise<{ chain: string }>;
}) {
  const { chain } = await params;
  if (!isChain(chain)) notFound();
  if (chain === "ethereum") redirect("/");
  return (
    <main>
      <AppHeader subtitle={CHAIN_NAMES[chain]} showSearch={false} />
      <div className="page-content">
        <div className="page-heading">
          <div>
            <h1>Explore {CHAIN_NAMES[chain]}</h1>
            <p>Select an address or transaction lookup.</p>
          </div>
        </div>
        <section className="panel panel-body">
          <SearchBar initialChain={chain} />
          <p className="muted mt-4">
            Lookups use public chain data. Availability depends on the provider
            and the chain&apos;s privacy model.
          </p>
          <Link className="text-link mt-3" href="/chains">
            Connection status and coverage →
          </Link>
        </section>
      </div>
    </main>
  );
}
