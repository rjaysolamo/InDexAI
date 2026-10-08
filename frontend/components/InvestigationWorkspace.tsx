"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import Icon from "@/components/Icon";
import {
  useWorkspace,
  targetHref,
  type Investigation,
} from "@/components/WorkspaceProvider";
import { isAddress, isTxHash, shortAddress } from "@/lib/format";

export function NewInvestigation({
  target = "",
  label = "New investigation",
}: {
  target?: string;
  label?: string;
}) {
  const { createCase, ready, storageError } = useWorkspace();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const nameId = useId();
  return (
    <>
      <button
        className="button primary"
        disabled={!ready}
        onClick={() => dialog.current?.showModal()}
      >
        <Icon name="plus" size={17} />
        {label}
      </button>
      <dialog
        ref={dialog}
        className="case-dialog"
        aria-label="Create investigation"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const id = createCase(name, target);
            if (id) {
              dialog.current?.close();
              setName("");
              router.push(`/investigation/${id}`);
            }
          }}
        >
          <div className="panel-heading">
            <h2>New investigation</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Close dialog"
              onClick={() => dialog.current?.close()}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="panel-body">
            <p className="muted">
              Give your investigation a name. You can add evidence and notes as
              you explore.
            </p>
            <label className="input-label" htmlFor={nameId}>
              Investigation name
            </label>
            <input
              id={nameId}
              autoFocus
              className="text-input"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Exchange transfer review"
            />
            <p className="local-notice">Saved locally in this browser.</p>
            {storageError && (
              <p role="alert" className="field-error">
                {storageError}
              </p>
            )}
            <button
              type="submit"
              className="button primary"
              disabled={!name.trim()}
            >
              Create investigation <Icon name="arrow" size={16} />
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function CaseList({ limit }: { limit?: number }) {
  const { data, ready } = useWorkspace();
  if (!ready) return <div className="empty-state">Loading your workspace…</div>;
  const cases = limit ? data.cases.slice(0, limit) : data.cases;
  if (!cases.length)
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <Icon name="folder" size={27} />
        </span>
        <h3>A fresh start for your next discovery</h3>
        <p>
          Create an investigation to keep addresses, transactions,
          <br className="desktop-break" /> and your notes together in one place.
        </p>
        <NewInvestigation label="Create your first investigation" />
      </div>
    );
  return (
    <div className="case-list">
      {cases.map((c, index) => (
        <Link className="case-row" href={`/investigation/${c.id}`} key={c.id}>
          <span className="case-icon">
            <Icon name="folder" />
          </span>
          <div className="case-row-title">
            <strong>{c.name}</strong>
            <small>
              CASE {String(data.cases.length - index).padStart(3, "0")}{" "}
              <span>·</span> {c.targets.length} saved item
              {c.targets.length !== 1 ? "s" : ""}
            </small>
          </div>
          <span className="tag">Open</span>
          <time dateTime={c.createdAt}>
            {new Date(c.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>
          <Icon name="chevron" size={16} />
        </Link>
      ))}
    </div>
  );
}
export function RecentActivity({ limit }: { limit?: number }) {
  const { data, ready } = useWorkspace();
  const visits = limit ? data.visits.slice(0, limit) : data.visits;
  if (!ready) return <p className="muted">Loading recent activity…</p>;
  if (!visits.length)
    return (
      <div className="activity-empty">
        <span className="soft-icon">
          <Icon name="clock" size={23} />
        </span>
        <h3>Your trail starts here</h3>
        <p>
          Addresses and transactions you open will appear here for easy access.
        </p>
        <Link href="/#investigate" className="text-link">
          Start exploring <Icon name="arrow" size={15} />
        </Link>
      </div>
    );
  return (
    <div className="recent-list">
      {visits.map((v) => (
        <Link href={targetHref(v.target)} className="recent-row" key={v.target}>
          <span className="soft-icon">
            <Icon name={isAddress(v.target) ? "wallet" : "flow"} size={17} />
          </span>
          <div>
            <strong>{shortAddress(v.target, 8, 5)}</strong>
            <small>
              {isAddress(v.target) ? "Wallet address" : "Transaction"} ·{" "}
              {new Date(v.viewedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </small>
          </div>
          <Icon name="chevron" size={15} />
        </Link>
      ))}
    </div>
  );
}
export function WorkspaceStats() {
  const { data, ready } = useWorkspace();
  const addresses = new Set(
    data.cases
      .flatMap((c) => c.targets)
      .filter(isAddress)
      .map((t) => t.toLowerCase()),
  ).size;
  const transactions = new Set(
    data.cases
      .flatMap((c) => c.targets)
      .filter(isTxHash)
      .map((t) => t.toLowerCase()),
  ).size;
  return (
    <div className="stats-grid">
      {(
        [
          [
            "Investigations",
            data.cases.length,
            "Your active case notebooks",
            "folder",
          ],
          [
            "Saved addresses",
            addresses,
            "Wallets connected to your cases",
            "wallet",
          ],
          [
            "Saved transactions",
            transactions,
            "Transfers worth a closer look",
            "flow",
          ],
          [
            "Recently explored",
            data.visits.length,
            "Pick up where you left off",
            "activity",
          ],
        ] as const
      ).map(([title, count, detail, icon]) => (
        <div className="stat-card" key={title}>
          <div>
            <span>{title}</span>
            <Icon name={icon} size={18} />
          </div>
          <strong>{ready ? String(count).padStart(2, "0") : "—"}</strong>
          <p>{detail}</p>
        </div>
      ))}
    </div>
  );
}
export function CaseDetail({ id }: { id: string }) {
  const { data, ready } = useWorkspace();
  const investigation = data.cases.find((c) => c.id === id);
  if (!ready) return <div className="empty-state">Loading investigation…</div>;
  if (!investigation)
    return (
      <div className="panel empty-state">
        <Icon name="folder" size={32} />
        <h1>Investigation not found</h1>
        <p>
          This case is not saved in this browser. Open your investigations to
          continue.
        </p>
        <Link className="button primary" href="/investigations">
          View investigations
        </Link>
      </div>
    );
  return <CaseEditor key={id} investigation={investigation} />;
}
function CaseEditor({ investigation: c }: { investigation: Investigation }) {
  const { updateCase } = useWorkspace();
  const [target, setTarget] = useState("");
  const [notes, setNotes] = useState(c.notes);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function addTarget(event: FormEvent) {
    event.preventDefault();
    const value = target.trim();
    if (!isAddress(value) && !isTxHash(value)) {
      setError("Enter a valid Ethereum address or transaction hash.");
      return;
    }
    if (c.targets.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setError("This item is already in your investigation.");
      return;
    }
    if (updateCase(c.id, { targets: [...c.targets, value] })) {
      setTarget("");
      setError("");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CASE NOTEBOOK</p>
          <h1>{c.name}</h1>
          <p>Connect the evidence. Build the bigger picture.</p>
        </div>
        <span className="tag">Open investigation</span>
      </div>
      <div className="notebook-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              Saved evidence{" "}
              <span className="count-pill">{c.targets.length}</span>
            </h2>
          </div>
          <div className="panel-body">
            <form onSubmit={addTarget}>
              <label className="input-label" htmlFor="case-target">
                Add an address or transaction
              </label>
              <div className="inline-form">
                <input
                  className="text-input"
                  id="case-target"
                  value={target}
                  onChange={(e) => {
                    setTarget(e.target.value);
                    setError("");
                  }}
                  placeholder="0x…"
                  aria-describedby={error ? "target-error" : undefined}
                  aria-invalid={!!error}
                />
                <button className="button primary" type="submit">
                  <Icon name="plus" size={16} /> Add
                </button>
              </div>
              {error && (
                <p id="target-error" role="alert" className="field-error">
                  {error}
                </p>
              )}
            </form>
            {c.targets.length === 0 ? (
              <div className="activity-empty">
                <Icon name="flow" size={30} />
                <h3>Start connecting the dots</h3>
                <p>
                  Add a wallet or transaction above, then open it to explore its
                  activity.
                </p>
              </div>
            ) : (
              <div className="evidence-list">
                {c.targets.map((t) => (
                  <div className="evidence-row" key={t}>
                    <Icon name={isAddress(t) ? "wallet" : "flow"} />
                    <Link href={targetHref(t)}>
                      <strong>{shortAddress(t)}</strong>
                      <small>
                        {isAddress(t)
                          ? "Explore wallet"
                          : "Inspect transaction & fund flow"}{" "}
                        →
                      </small>
                    </Link>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${t} from investigation`}
                      onClick={() =>
                        updateCase(c.id, {
                          targets: c.targets.filter((item) => item !== t),
                        })
                      }
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Investigation notes</h2>
            <Icon name="book" size={18} />
          </div>
          <form
            className="panel-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (updateCase(c.id, { notes })) setMessage("Notes saved.");
            }}
          >
            <label htmlFor="case-notes" className="input-label">
              What have you discovered?
            </label>
            <textarea
              id="case-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setMessage("");
              }}
              placeholder="Capture observations, connections, and next steps…"
              rows={10}
              className="text-input"
            />
            <div className="notes-footer">
              <span role="status" className="muted">
                {message ||
                  (notes !== c.notes
                    ? "Unsaved changes"
                    : "Saved in this browser")}
              </span>
              <button className="button primary" type="submit">
                Save notes
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
