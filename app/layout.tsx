import type { Metadata, Viewport } from 'next'
import { SALON } from '@/lib/salon'
import './globals.css'
import { DemoBar } from '@/components/DemoBar'

export const metadata: Metadata = {
  title: { default: SALON.name, template: `%s · ${SALON.name}` },
  description: 'Book your next appointment',
  appleWebApp: { capable: true, title: SALON.name, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#ededed',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* General Sans, one weight only: hierarchy comes from size. Served by Fontshare, as its licence asks. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@500&display=swap" />
      </head>
      <body>
        <DemoBar />
        {children}
      </body>
    </html>
  )
}
