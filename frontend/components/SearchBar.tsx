"use client";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  makeTarget,
  targetHref,
  CHAIN_NAMES,
  type Chain,
  type LookupKind,
} from "@/lib/chains";
import ChainFields from "@/components/ChainFields";
import Icon from "@/components/Icon";

export default function SearchBar({
  initialValue = "",
  compact = false,
  autofocus = false,
  initialChain = "ethereum",
}: {
  initialValue?: string;
  compact?: boolean;
  autofocus?: boolean;
  initialChain?: Chain;
}) {
  const router = useRouter();
  const id = useId();
  const [chain, setChain] = useState<Chain>(initialChain);
  const [kind, setKind] = useState<LookupKind>("address");
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const query = value.trim();
    const target = makeTarget(chain, kind, query);
    if (!target) {
      setError(
        `Enter a valid ${CHAIN_NAMES[chain]} ${chain === "ethereum" ? "address or transaction hash" : kind === "transaction" && chain === "solana" ? "transaction signature" : kind}.`,
      );
      return;
    }
    setError("");
    router.push(targetHref(target));
  }
  return (
    <form
      onSubmit={submit}
      className={`search-form ${compact ? "compact" : ""}`}
      role="search"
    >
      <ChainFields
        chain={chain}
        kind={kind}
        onChain={(c) => {
          setChain(c);
          setError("");
        }}
        onKind={(k) => {
          setKind(k);
          setError("");
        }}
      />
      <div className="search-input-wrap">
        <Icon name="search" size={compact ? 17 : 21} />
        <input
          id={id}
          aria-label="Search wallet address or transaction hash"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          value={value}
          autoFocus={autofocus}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          placeholder={
            compact
              ? "Search address or transaction…"
              : "Enter a wallet address or transaction hash…"
          }
        />
        <button
          type="submit"
          className={compact ? "icon-button" : "button primary"}
          aria-label={compact ? "Search" : undefined}
        >
          {compact ? (
            <Icon name="arrow" size={17} />
          ) : (
            <>
              Investigate <Icon name="arrow" size={17} />
            </>
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </form>
  );
}
