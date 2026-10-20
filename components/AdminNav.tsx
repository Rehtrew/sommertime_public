'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, ChartColumn, House, Scissors, Users } from 'lucide-react'

const ITEMS = [
  { href: '/admin', label: 'Overview', icon: House },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/services', label: 'Services', icon: Scissors },
  { href: '/admin/stats', label: 'Statistics', icon: ChartColumn },
]

function active(path: string, href: string) {
  if (href === '/admin') return path === '/admin'
  if (href === '/admin/calendar') return path.startsWith('/admin/calendar') || path.startsWith('/admin/booking')
  return path.startsWith(href)
}

export function AdminNav({ variant }: { variant: 'sidebar' | 'tabs' }) {
  const path = usePathname()
  if (variant === 'sidebar') {
    return (
      <nav className="flex flex-col gap-1">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-body transition-colors ${
              active(path, href) ? 'bg-ink text-white' : 'text-ink hover:bg-card'
            }`}
          >
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </nav>
    )
  }
  return (
    <nav className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-[26px] bg-ink p-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] md:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-col items-center gap-1 rounded-[20px] py-2 text-caption transition-colors ${
            active(path, href) ? 'bg-white/15 text-white' : 'text-white/55'
          }`}
        >
          <Icon size={21} strokeWidth={1.8} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
