import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Principles",
  description: "The ideas I choose to live by.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f1ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">
        <div className="mx-auto max-w-2xl px-5 sm:px-8 py-10 sm:py-16">{children}</div>
      </body>
    </html>
  );
}
