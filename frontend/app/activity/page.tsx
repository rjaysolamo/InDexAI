import AppHeader from "@/components/AppHeader";
import { RecentActivity } from "@/components/InvestigationWorkspace";
export default function ActivityPage() {
  return (
    <main>
      <AppHeader subtitle="Recent activity" />
      <div className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">CONTINUE EXPLORING</p>
            <h1>Recent activity</h1>
            <p>
              Return to the last 30 wallets and transactions you opened in this
              browser.
            </p>
          </div>
        </div>
        <section className="panel">
          <div className="panel-heading">
            <h2>Your exploration history</h2>
          </div>
          <RecentActivity />
        </section>
      </div>
    </main>
  );
}
