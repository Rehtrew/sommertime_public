import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { SALON } from '@/lib/salon'
import './globals.css'
import { DemoBar } from '@/components/DemoBar'

// One weight only, by design: hierarchy comes from size and colour.
const sans = Geist({
  subsets: ['latin', 'latin-ext'],
  weight: '500',
  variable: '--font-face',
  display: 'swap',
})

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
    <html lang="en" className={sans.variable}>
      <body>
        <DemoBar />
        {children}
      </body>
    </html>
  )
}
