import Link from "next/link";

import SearchBar from "@/components/SearchBar";

type Props = {
  subtitle?: string;
  showSearch?: boolean;
};

export default function AppHeader({
  subtitle = "Blockchain investigation",
  showSearch = true,
}: Props) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="shrink-0">
          <div className="text-lg font-semibold tracking-tight">InDexAI</div>
          <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>
        </Link>

        {showSearch && (
          <div className="w-full max-w-xl">
            <SearchBar compact />
          </div>
        )}
      </div>
    </header>
  );
}
