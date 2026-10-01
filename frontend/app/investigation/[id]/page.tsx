import Link from "next/link";

import AppHeader from "@/components/AppHeader";

export default function InvestigationPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <AppHeader />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-xs uppercase tracking-wider text-gray-400">
          Investigation
        </p>
        <h1 className="mt-2 text-xl font-semibold">Coming soon</h1>
        <p className="mt-2 text-sm text-gray-500">
          Multi-step investigation cases will connect to the backend tracing
          endpoints. Use address or transaction search for now.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-gray-900 underline"
        >
          Back to search
        </Link>
      </div>
    </main>
  );
}
