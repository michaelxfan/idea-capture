import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dual Intent OS",
  description:
    "A second brain for what you say you want, what you actually optimize for under pressure, and when that switch happens.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink-900 antialiased">{children}</body>
    </html>
  );
}
