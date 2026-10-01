import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <AppHeader showSearch={false} />

      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Investigation
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Follow the money on-chain
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Look up a wallet or transaction to inspect transfers, labels, and fund
          flow from the InDexAI indexer.
        </p>

        <div className="mt-8">
          <SearchBar autofocus />
        </div>

        <div className="mt-10 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
          <Capability
            title="Address"
            detail="Label, chain, and recent IN/OUT transfers"
          />
          <Capability
            title="Transaction"
            detail="Details plus decoded ERC-20 fund flow"
          />
        </div>
      </div>
    </main>
  );
}

function Capability({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-gray-200 px-4 py-3">
      <div className="font-medium text-gray-900">{title}</div>
      <div className="mt-1 text-xs text-gray-500">{detail}</div>
    </div>
  );
}
