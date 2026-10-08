"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Icon, { type IconName } from "@/components/Icon";
import {
  WorkspaceProvider,
  useWorkspace,
} from "@/components/WorkspaceProvider";

const links: { href: string; title: string; icon: IconName }[] = [
  { href: "/", title: "Overview", icon: "grid" },
  { href: "/investigations", title: "Investigations", icon: "folder" },
  { href: "/activity", title: "Recent activity", icon: "clock" },
  { href: "/indexer", title: "Indexer", icon: "flow" },
];
function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { data, storageError } = useWorkspace();
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="mobile-bar">
        <Link href="/" className="brand">
          <span className="brand-mark">i</span> InDex<span>AI</span>
        </Link>
        <button
          className="icon-button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">i</span>
          <span>
            InDex<span className="brand-ai">AI</span>
            <small>ON-CHAIN INTELLIGENCE</small>
          </span>
        </Link>
        <div className="workspace-label">
          <span className="workspace-avatar">W</span>
          <div>
            My workspace<small>Personal workspace</small>
          </div>
          <span className="local-pill">LOCAL</span>
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? path === "/"
                : path.startsWith(link.href) ||
                  (link.href === "/investigations" &&
                    path.startsWith("/investigation/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon name={link.icon} />
                {link.title}
                {link.href === "/investigations" && (
                  <span className="nav-count">{data.cases.length}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="soft-icon">
              <Icon name="flow" />
            </span>
            <h3>Every connection counts.</h3>
            <p>Turn on-chain activity into a clearer picture.</p>
            <Link href="/guide" onClick={() => setOpen(false)}>
              Explore the workflow <Icon name="arrow" size={15} />
            </Link>
          </div>
          <Link
            className={`nav-link ${path === "/guide" ? "active" : ""}`}
            href="/guide"
            onClick={() => setOpen(false)}
          >
            <Icon name="book" /> Getting started
          </Link>
          <div className="sidebar-footer">
            <span className="profile-avatar">W</span>
            <div>
              Your workspace<small>Saved on this browser</small>
            </div>
            <Icon name="shield" size={17} />
          </div>
        </div>
      </aside>
      <div className="workspace-main" id="main-content">
        {storageError && (
          <div role="alert" className="storage-alert">
            {storageError}
          </div>
        )}
        {children}
        <footer className="page-footer">
          <span>
            InDexAI <span className="footer-dot">·</span> Follow the money
            on-chain.
          </span>
          <span>
            Ethereum <span className="footer-dot">·</span> Early access
          </span>
        </footer>
      </div>
    </div>
  );
}
export default function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
