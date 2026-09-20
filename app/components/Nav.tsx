"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import ClaimDialog from "./ClaimDialog";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
];

export default function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <header className="site-header">
      <div className="nav-inner">
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link href="/" className="brand">
            <span className="brand-mark">❧</span>
            <span>
              CarbonTrace <span className="lite">Lite</span>
            </span>
          </Link>
          <nav className="nav-links">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="nav-cta-group">
          <button
            className="icon-btn"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="btn btn-sm nav-cta"
            onClick={() => setDialogOpen(true)}
          >
            + Submit a claim
          </button>
        </div>
      </div>
      </header>
      <ClaimDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
