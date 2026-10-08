import type { Chain } from "@/lib/chains";
import ServiceHealth from "@/components/ServiceHealth";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import Icon from "@/components/Icon";

export default function AppHeader({
  subtitle = "Overview",
  showSearch = true,
  chain = "ethereum",
}: {
  subtitle?: string;
  showSearch?: boolean;
  chain?: Chain;
}) {
  return (
    <header className="app-header">
      <div className="breadcrumbs">
        <Link href="/">Workspace</Link>
        <Icon name="chevron" size={13} />
        <span>{subtitle}</span>
      </div>
      {showSearch && (
        <div className="header-search">
          <SearchBar key={chain} compact initialChain={chain} />
        </div>
      )}
      <ServiceHealth />
    </header>
  );
}
