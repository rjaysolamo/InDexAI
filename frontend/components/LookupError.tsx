import Link from "next/link";
import Icon from "@/components/Icon";
export default function LookupError({
  type,
  target,
}: {
  type: string;
  target: string;
}) {
  return (
    <section className="panel lookup-error">
      <span className="empty-icon">
        <Icon name="search" size={28} />
      </span>
      <h1>Unable to load {type}</h1>
      <p>
        The data service is unavailable right now. Try again in a moment or
        continue with your investigation notes.
      </p>
      <code>{target}</code>
      <div>
        <a
          href={`/${type === "address" ? "address" : "transaction"}/${encodeURIComponent(target)}`}
          className="button primary"
        >
          Try again
        </a>
        <Link href="/investigations" className="button secondary">
          View investigations
        </Link>
      </div>
    </section>
  );
}
