"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="leaf">◆</span> CarbonTrace Lite
        </Link>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={pathname === l.href ? { color: "var(--text)", fontWeight: 600 } : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="btn nav-cta">
          Submit a claim
        </Link>
      </div>
    </header>
  );
}