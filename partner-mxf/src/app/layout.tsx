import "./globals.css";
import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Partner",
  description: "Drift detection. Calibrated repair. Emotional consistency.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Partner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg">
        <main className="max-w-lg mx-auto px-4 pt-8 pb-nav">{children}</main>
        <Nav />
      </body>
    </html>
  );
}
