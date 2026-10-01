"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { isAddress, isTxHash } from "@/lib/format";

type Props = {
  initialValue?: string;
  compact?: boolean;
  autofocus?: boolean;
};

export default function SearchBar({
  initialValue = "",
  compact = false,
  autofocus = false,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();

    const query = value.trim();
    if (!query) {
      setError("Enter an address or transaction hash.");
      return;
    }

    if (isAddress(query)) {
      setError(null);
      router.push(`/address/${query}`);
      return;
    }

    if (isTxHash(query)) {
      setError(null);
      router.push(`/transaction/${query}`);
      return;
    }

    setError("Use a valid 0x address (40 hex) or transaction hash (64 hex).");
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          value={value}
          autoFocus={autofocus}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder="Search address or transaction hash (0x…)"
          className={[
            "w-full rounded-md border border-gray-300 bg-white px-3 font-mono text-sm outline-none focus:border-gray-500",
            compact ? "h-9" : "h-11",
          ].join(" ")}
        />

        <button
          type="submit"
          className={[
            "shrink-0 rounded-md bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-800",
            compact ? "h-9" : "h-11",
          ].join(" ")}
        >
          Investigate
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </form>
  );
}
