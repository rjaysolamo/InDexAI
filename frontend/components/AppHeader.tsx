import ServiceHealth from "@/components/ServiceHealth";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import Icon from "@/components/Icon";

export default function AppHeader({
  subtitle = "Overview",
  showSearch = true,
}: {
  subtitle?: string;
  showSearch?: boolean;
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
          <SearchBar compact />
        </div>
      )}
      <ServiceHealth />
    </header>
  );
}
