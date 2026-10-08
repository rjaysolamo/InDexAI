import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import Icon from "@/components/Icon";
import {
  CaseList,
  NewInvestigation,
  RecentActivity,
  WorkspaceStats,
} from "@/components/InvestigationWorkspace";

export default function Home() {
  return (
    <main>
      <AppHeader showSearch={false} />
      <div className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR INVESTIGATION WORKSPACE</p>
            <h1>
              See the connections.
              <br className="mobile-only" /> Find the story.
            </h1>
            <p>
              A clearer view of on-chain activity, from the first address to the
              final destination.
            </p>
          </div>
          <NewInvestigation />
        </div>
        <section className="search-hero" id="investigate">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span /> FOLLOW THE MONEY ON-CHAIN
            </div>
            <h2>
              Every transaction
              <br />
              leaves a trail.
            </h2>
            <p>
              Follow wallets, uncover transfers, and connect the dots.
              <br />
              Your next investigation starts with a search.
            </p>
            <SearchBar />
            <div className="search-hints">
              <span>
                <Icon name="shield" size={13} /> Ethereum mainnet
              </span>
              <span>Wallet addresses & transaction hashes</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <svg viewBox="0 0 350 250" className="flow-lines">
              <path d="M35 60H115Q135 60 135 80V120H205M205 120H265Q280 120 280 100V50H325M205 120H265Q280 120 280 140V205H325M35 205H100Q115 205 115 185V140H205" />
              <path
                className="bright-line"
                d="M35 60H115Q135 60 135 80V120H205M205 120H265Q280 120 280 140V205H325"
              />
            </svg>
            <div className="flow-node source-node">
              <Icon name="wallet" size={22} />
              <span>
                Source wallet<small>0x71C…9A82</small>
              </span>
            </div>
            <div className="flow-node center-node">
              <Icon name="flow" size={30} />
            </div>
            <div className="flow-node destination-node">
              <Icon name="wallet" size={19} />
              <span>
                Destination<small>0x8D2…4F91</small>
              </span>
            </div>
            <div className="mini-node node-top">
              <Icon name="globe" size={21} />
            </div>
            <div className="mini-node node-bottom">
              <Icon name="wallet" size={21} />
            </div>
            <span className="flow-label">TRACE THE CONNECTION</span>
          </div>
        </section>
        <WorkspaceStats />
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                Your investigations{" "}
                <span className="subtle-label">
                  A place for the bigger picture
                </span>
              </h2>
              <Link href="/investigations" className="text-link">
                View all <Icon name="arrow" size={15} />
              </Link>
            </div>
            <CaseList limit={3} />
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Recent activity</h2>
              <Link
                href="/activity"
                className="icon-button"
                aria-label="View all recent activity"
              >
                <Icon name="arrow" size={17} />
              </Link>
            </div>
            <RecentActivity limit={3} />
          </section>
        </div>
        <div className="section-heading">
          <h2>From a lead to a clearer picture</h2>
          <Link href="/guide" className="text-link">
            How it works <Icon name="arrow" size={15} />
          </Link>
        </div>
        <div className="workflow-grid">
          <Link href="/#investigate" className="workflow-card">
            <span className="workflow-number">01</span>
            <span className="soft-icon">
              <Icon name="wallet" size={23} />
            </span>
            <h3>
              Explore a wallet <Icon name="arrow" size={17} />
            </h3>
            <p>
              See address labels, counterparties, and incoming and outgoing
              activity.
            </p>
          </Link>
          <Link href="/guide#fund-flow" className="workflow-card">
            <span className="workflow-number">02</span>
            <span className="soft-icon blue">
              <Icon name="flow" size={23} />
            </span>
            <h3>
              Follow the fund flow <Icon name="arrow" size={17} />
            </h3>
            <p>
              Connect transactions to token transfers and discover where funds
              move.
            </p>
          </Link>
          <Link href="/investigations" className="workflow-card">
            <span className="workflow-number">03</span>
            <span className="soft-icon amber">
              <Icon name="folder" size={23} />
            </span>
            <h3>
              Bring it all together <Icon name="arrow" size={17} />
            </h3>
            <p>
              Keep your evidence and observations connected in one
              investigation.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
