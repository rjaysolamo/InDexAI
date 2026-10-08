"use client";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isAddress, isTxHash } from "@/lib/format";
import Icon from "@/components/Icon";

export default function SearchBar({
  initialValue = "",
  compact = false,
  autofocus = false,
}: {
  initialValue?: string;
  compact?: boolean;
  autofocus?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (!isAddress(query) && !isTxHash(query)) {
      setError(
        "Enter a valid Ethereum address (0x + 40 characters) or transaction hash (0x + 64 characters).",
      );
      return;
    }
    setError("");
    router.push(`/${isAddress(query) ? "address" : "transaction"}/${query}`);
  }
  return (
    <form
      onSubmit={submit}
      className={`search-form ${compact ? "compact" : ""}`}
      role="search"
    >
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
