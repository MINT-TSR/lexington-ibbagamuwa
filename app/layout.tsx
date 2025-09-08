import './globals.css'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const LogoutButton = dynamic(() => import('../components/LogoutButton'), { ssr: false })

export const metadata: Metadata = {
  title: 'Lexington International - Preschool Payments',
  description: 'Admin dashboard for tracking preschool payments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://i.postimg.cc/zB72KbQW/jnmtyhj.png" alt="Lexington" className="h-10 sm:h-12 w-auto" />
            <span className="text-xs sm:text-sm text-gray-600">Finance Dashboard</span>
          </div>
          <LogoutButton />
        </div>
        {children}
      </body>
    </html>
  )
}

