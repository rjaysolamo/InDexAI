import AppHeader from "@/components/AppHeader";
import {
  CaseList,
  NewInvestigation,
} from "@/components/InvestigationWorkspace";
export default function InvestigationsPage() {
  return (
    <main>
      <AppHeader subtitle="Investigations" />
      <div className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR CASE NOTEBOOKS</p>
            <h1>Investigations</h1>
            <p>Keep the evidence connected and your next steps in sight.</p>
          </div>
          <NewInvestigation />
        </div>
        <section className="panel">
          <div className="panel-heading">
            <h2>All investigations</h2>
            <span className="subtle-label">Saved in this browser</span>
          </div>
          <CaseList />
        </section>
        <p className="local-notice">
          Your notebooks are stored locally in this browser. They are not synced
          across devices; clearing browser data removes them.
        </p>
      </div>
    </main>
  );
}
