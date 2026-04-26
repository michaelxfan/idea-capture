import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Today" },
  { href: "/capture", label: "Capture" },
  { href: "/patterns", label: "Patterns" },
  { href: "/review", label: "Review" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-100 bg-paper/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-5 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-serif text-lg tracking-tight text-ink-900 shrink-0">
            Dual Intent <span className="text-ink-400">OS</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm text-ink-600">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-1.5 rounded-lg hover:bg-ink-50 hover:text-ink-900 transition"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-5 py-8 md:py-12">{children}</main>
    </div>
  );
}
