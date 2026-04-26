import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '2026 Big Rock Ideas: Q2 — Greenhouse',
  description: 'Quarterly strategy dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
