"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { NewInvestigation } from "@/components/InvestigationWorkspace";
import Icon from "@/components/Icon";
export default function EntityActions({ target }: { target: string }) {
  const { ready, recordVisit, data, updateCase, storageError } = useWorkspace();
  const recorded = useRef("");
  const [copyMessage, setCopyMessage] = useState("");
  const [selected, setSelected] = useState("");
  const [saved, setSaved] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (ready && recorded.current !== target) {
      recorded.current = target;
      recordVisit(target);
    }
  }, [ready, target, recordVisit]);
  return (
    <div className="entity-actions">
      <Link href="/activity" className="text-link">
        <Icon name="clock" size={16} /> Recent activity
      </Link>
      <div className="entity-buttons">
        <button
          className="button secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(target);
              setCopyMessage("Copied to clipboard");
            } catch {
              setCopyMessage(
                "Could not copy. Select the address or hash to copy it manually.",
              );
            }
          }}
        >
          <Icon name="copy" size={15} /> Copy
        </button>
        <button
          className="button primary"
          disabled={!ready}
          onClick={() => {
            setSaved("");
            dialog.current?.showModal();
          }}
        >
          <Icon name="plus" size={16} /> Save to investigation
        </button>
      </div>
      <span className="action-feedback" role="status">
        {copyMessage}
      </span>
      <dialog
        ref={dialog}
        className="case-dialog"
        aria-label="Save to investigation"
      >
        <div className="panel-heading">
          <h2>Connect this evidence</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="panel-body">
          {storageError && (
            <p role="alert" className="field-error">
              {storageError}
            </p>
          )}
          {data.cases.length > 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const c = data.cases.find((item) => item.id === selected);
                if (
                  c &&
                  (c.targets.some(
                    (t) => t.toLowerCase() === target.toLowerCase(),
                  ) ||
                    updateCase(c.id, { targets: [...c.targets, target] }))
                )
                  setSaved(c.id);
              }}
            >
              <label htmlFor="existing-case" className="input-label">
                Choose an investigation
              </label>
              <select
                id="existing-case"
                className="text-input"
                required
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setSaved("");
                }}
              >
                <option value="" disabled>
                  Select a case
                </option>
                {data.cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                className="button primary"
                type="submit"
                disabled={!selected}
              >
                Save evidence
              </button>
              {saved && (
                <p role="status" className="saved-message">
                  Saved.{" "}
                  <Link
                    href={`/investigation/${saved}`}
                    onClick={() => dialog.current?.close()}
                  >
                    Open investigation →
                  </Link>
                </p>
              )}
              <div className="form-divider">or start a new case</div>
            </form>
          )}
          <NewInvestigation target={target} />
        </div>
      </dialog>
    </div>
  );
}
