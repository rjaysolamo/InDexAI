"use client";
import { useState } from "react";
import { getInvestigation, type InvestigationResponse } from "@/lib/api";

export default function InvestigationRun({ target }: { target: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<InvestigationResponse | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="my-3">
      <button
        type="button"
        className="button secondary"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          setResult(null);
          try {
            setResult(await getInvestigation(target));
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Unable to initialize investigation.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Initializing…" : "Initialize trace"}
      </button>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {result && (
        <div role="status" className="muted mt-2">
          <p>{result.message}</p>
          <p className="break-all">
            Target: {result.target} · Depth: {result.depth}
          </p>
        </div>
      )}
    </div>
  );
}
