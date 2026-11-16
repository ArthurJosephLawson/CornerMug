"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shared top navigation for the non-game pages. The play page embeds the
 * cafe link back instead of this full nav (canvas needs the screen space).
 */
export default function SiteNav() {
  const pathname = usePathname();

  const link = (href: string, label: string) => (
    <Link href={href} className={`nav-link${pathname === href ? " active" : ""}`}>
      {label}
    </Link>
  );

  return (
    <nav className="site-nav">
      <Link href="/" className="brand">
        <span className="brand-dot" />
        Corner Mug
      </Link>
      <div className="spacer" />
      {link("/cafe", "Cafe")}
      {link("/help", "Help")}
      {link("/settings", "Settings")}
      {link("/stats", "Stats")}
    </nav>
  );
}
