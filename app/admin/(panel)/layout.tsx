import Link from 'next/link'
import type { Metadata } from 'next'
import { LogOut } from 'lucide-react'
import { AdminNav } from '@/components/AdminNav'
import { requireAdmin } from '@/lib/auth'
import { adminLogout } from '@/app/actions/admin'
import { SALON } from '@/lib/salon'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin' }, robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="mx-auto min-h-svh max-w-[1200px] md:grid md:grid-cols-[220px_1fr] md:gap-8 md:px-6">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-svh md:flex-col md:py-8">
        <Link href="/admin" className="mb-8 px-4 text-title">
          {SALON.name}
        </Link>
        <AdminNav variant="sidebar" />
        <form action={adminLogout} className="mt-auto">
          <button className="flex items-center gap-3 px-4 py-3 text-small text-muted hover:text-ink">
            <LogOut size={18} /> Log out
          </button>
        </form>
      </aside>
      <div className="px-3 pt-4 pb-32 md:px-0 md:pt-8 md:pb-16">
        <header className="mb-2 flex items-center justify-between px-2 md:hidden">
          <Link href="/admin" className="text-title">
            {SALON.name}
          </Link>
          <form action={adminLogout}>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Log out">
              <LogOut size={18} />
            </button>
          </form>
        </header>
        <main>{children}</main>
        <AdminNav variant="tabs" />
      </div>
    </div>
  )
}
