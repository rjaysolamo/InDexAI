"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="page-content">
      <div className="panel empty-state">
        <h1>Something interrupted this view</h1>
        <p>Please try loading the page again.</p>
        <button onClick={reset} className="button primary">
          Try again
        </button>
      </div>
    </section>
  );
}
