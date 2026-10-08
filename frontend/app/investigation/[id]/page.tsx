import AppHeader from "@/components/AppHeader";
import { CaseDetail } from "@/components/InvestigationWorkspace";
export default async function InvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <AppHeader subtitle="Investigation notebook" />
      <div className="page-content">
        <CaseDetail id={id} />
      </div>
    </main>
  );
}
