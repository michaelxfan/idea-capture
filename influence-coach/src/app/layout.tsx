import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "InfluenceCoach",
  description: "Stakeholder intelligence and influence coaching for Directors",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <div className="max-w-[1180px] mx-auto px-6 py-5">
          <Nav />
          <main className="mt-6">{children}</main>
          <footer className="mt-16 pt-6 border-t border-[var(--border-light)] text-xs text-[var(--text-tertiary)]">
            InfluenceCoach · Internal stakeholder coaching tool
          </footer>
        </div>
      </body>
    </html>
  );
}
