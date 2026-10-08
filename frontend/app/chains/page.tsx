import AppHeader from "@/components/AppHeader";
import ChainConnections from "@/components/ChainConnections";
export default function ChainsPage() {
  return (
    <main>
      <AppHeader subtitle="Chain connections" />
      <div className="page-content">
        <div className="page-heading">
          <div>
            <h1>Chain connections</h1>
            <p>Explore public activity across networks.</p>
          </div>
        </div>
        <ChainConnections />
      </div>
    </main>
  );
}
