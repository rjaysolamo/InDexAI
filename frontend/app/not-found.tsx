import Link from "next/link";
import AppHeader from "@/components/AppHeader";
export default function NotFound() {
  return (
    <main>
      <AppHeader subtitle="Page not found" />
      <div className="page-content">
        <section className="panel empty-state">
          <h1>This trail ends here</h1>
          <p>
            The page could not be found. Check the address or start a new
            search.
          </p>
          <Link href="/" className="button primary">
            Back to overview
          </Link>
        </section>
      </div>
    </main>
  );
}
