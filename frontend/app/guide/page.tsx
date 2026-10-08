import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Icon from "@/components/Icon";
export default function GuidePage() {
  return (
    <main>
      <AppHeader subtitle="Getting started" />
      <div className="page-content guide-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">THE INVESTIGATION WORKFLOW</p>
            <h1>Follow a lead. Connect the dots.</h1>
            <p>
              Move naturally from a wallet to its transactions, transfers, and
              connected addresses.
            </p>
          </div>
        </div>
        {[
          {
            id: "wallets",
            title: "Start with a wallet or transaction",
            text: "Choose a chain, then paste an address or transaction identifier into search. New chains use an explicit lookup type. Open the Chains page to check connections and coverage. Ethereum includes labels and fund flow; other chains show their available public details.",
          },
          {
            id: "fund-flow",
            title: "Follow the movement of funds",
            text: "The Ethereum transaction page connects its details to decoded fund flow. Each transfer links to its source, destination, and token contract. Open any address to continue exploring; recent activity keeps your trail within reach.",
          },
          {
            id: "privacy",
            title: "Understand what each chain makes public",
            text: "Zcash shielded transfers and Monero transactions conceal information. Public nodes cannot reveal private balances, real senders, recipients or hidden amounts. InDexAI shows those limits explicitly and does not request view keys or seed phrases.",
          },
          {
            id: "notebooks",
            title: "Keep your evidence together",
            text: "Use Save to investigation on a wallet or transaction to add it to a case notebook. Add related addresses, transactions, and notes as you discover them. Notebooks are saved in this browser and are not synced across devices.",
          },
        ].map((step, i) => (
          <section className="panel guide-step" id={step.id} key={step.id}>
            <span className="step-number">0{i + 1}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
          </section>
        ))}
        <div className="guide-callout">
          <Icon name="shield" size={25} />
          <div>
            <h3>Context makes the difference</h3>
            <p>
              Labels and transfers are leads to investigate, not proof of
              ownership or wrongdoing. Coverage depends on the connected indexer
              and available Ethereum data.
            </p>
          </div>
        </div>
        <Link href="/#investigate" className="button primary">
          Start exploring <Icon name="arrow" size={17} />
        </Link>
      </div>
    </main>
  );
}
