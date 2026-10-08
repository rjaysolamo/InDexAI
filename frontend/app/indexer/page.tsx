import AppHeader from "@/components/AppHeader";
import IndexerTools from "@/components/IndexerTools";
export default function IndexerPage() {
  return (
    <main>
      <AppHeader subtitle="Indexer" />
      <div className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ETHEREUM DATA</p>
            <h1>Indexer tools</h1>
            <p>Find token movements across blocks.</p>
          </div>
        </div>
        <IndexerTools />
      </div>
    </main>
  );
}
