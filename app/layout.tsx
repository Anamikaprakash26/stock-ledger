import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'stock-ledger',
  description: 'Inventory & stock-movement tracker — where stock is and where it is lost.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              stock-ledger
            </Link>
            <div className="navlinks">
              <Link href="/">Dashboard</Link>
              <Link href="/movements">Movements</Link>
              <Link href="/new" className="btn btn-sm">
                Record movement
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
