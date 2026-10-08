"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { parseTarget, targetKey } from "@/lib/chains";
export { targetHref } from "@/lib/chains";

export type Investigation = {
  id: string;
  name: string;
  notes: string;
  targets: string[];
  createdAt: string;
};
export type Visit = { target: string; viewedAt: string };
type Data = { cases: Investigation[]; visits: Visit[] };
const empty: Data = { cases: [], visits: [] };
const key = "indexai.workspace.v1";
const validTarget = (value: unknown): value is string =>
  typeof value === "string" && parseTarget(value) !== null;
const validDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
function readData(): Data {
  const raw: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
  if (!raw || typeof raw !== "object") return empty;
  const data = raw as Data;
  return {
    cases: Array.isArray(data.cases)
      ? data.cases.filter(
          (c) =>
            c &&
            typeof c.id === "string" &&
            typeof c.name === "string" &&
            typeof c.notes === "string" &&
            validDate(c.createdAt) &&
            Array.isArray(c.targets) &&
            c.targets.every(validTarget),
        )
      : [],
    visits: Array.isArray(data.visits)
      ? data.visits
          .filter((v) => v && validTarget(v.target) && validDate(v.viewedAt))
          .slice(0, 30)
      : [],
  };
}
const Context = createContext<{
  data: Data;
  ready: boolean;
  storageError: string;
  createCase: (name: string, target?: string) => string | null;
  updateCase: (
    id: string,
    changes: Partial<Pick<Investigation, "notes" | "targets">>,
  ) => boolean;
  recordVisit: (target: string) => void;
} | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(empty);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    function restore() {
      try {
        setData(readData());
      } catch {
        setStorageError(
          "Browser storage is unavailable. Your workspace cannot be saved.",
        );
      }
      setReady(true);
    }
    restore();
    const sync = (event: StorageEvent) => {
      if (event.key === key || event.key === null) restore();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function save(next: Data) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setData(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError(
        "Your changes could not be saved. Check available browser storage and try again.",
      );
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        data,
        ready,
        storageError,
        createCase(name, target) {
          if (!ready || !name.trim() || (target && !validTarget(target)))
            return null;
          const id = crypto.randomUUID();
          return save({
            ...data,
            cases: [
              {
                id,
                name: name.trim(),
                notes: "",
                targets: target ? [target] : [],
                createdAt: new Date().toISOString(),
              },
              ...data.cases,
            ],
          })
            ? id
            : null;
        },
        updateCase(id, changes) {
          if (
            !ready ||
            (changes.targets && !changes.targets.every(validTarget))
          )
            return false;
          return save({
            ...data,
            cases: data.cases.map((c) =>
              c.id === id ? { ...c, ...changes } : c,
            ),
          });
        },
        recordVisit(target) {
          if (!ready || !validTarget(target)) return;
          save({
            ...data,
            visits: [
              { target, viewedAt: new Date().toISOString() },
              ...data.visits.filter(
                (v) => targetKey(v.target) !== targetKey(target),
              ),
            ].slice(0, 30),
          });
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("WorkspaceProvider is required");
  return context;
}
