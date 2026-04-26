"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Today",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" strokeWidth="1.6" stroke="currentColor" fill="none" />
      </svg>
    ),
  },
  {
    href: "/analyze",
    label: "Analyze",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" fill={active ? "currentColor" : "none"} />
        <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" />
      </svg>
    ),
  },
  {
    href: "/log",
    label: "Log",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" fill={active ? "currentColor" : "none"} stroke="currentColor" />
        <path d="M8 12h8M8 8h8M8 16h5" stroke={active ? "white" : "currentColor"} strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/summary",
    label: "Summary",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth={active ? "2.2" : "1.6"} />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ href, label, icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${active ? "text-ink" : "text-ink-subtle"}`}>
              {icon(active)}
              <span className={`text-[10px] font-medium tracking-wide ${active ? "text-ink" : "text-ink-subtle"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-bottom bg-surface" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}
