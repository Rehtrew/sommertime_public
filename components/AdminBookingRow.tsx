import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { categoryColor } from '@/lib/format'
import { fmtTime } from '@/lib/time'
import type { Booking } from '@/lib/data'
import { LinkPending } from '@/components/LinkPending'

export function AdminBookingRow({ b, showDate, hideCustomer }: { b: Booking; showDate?: string; hideCustomer?: boolean }) {
  return (
    <Link
      href={`/admin/booking/${b.id}`}
      className="relative flex items-stretch gap-4 rounded-[20px] bg-tile p-4 transition-colors hover:bg-tile-strong"
    >
      <LinkPending />
      <span className="w-1 shrink-0 rounded-full" style={{ background: categoryColor(b.category) }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-small text-muted">
          {showDate ? `${showDate} · ` : ''}
          {fmtTime(b.start_min)}–{fmtTime(b.end_min)}
        </span>
        <span className="block truncate">
          {hideCustomer ? b.service_name : (b.customer_name ?? 'Deleted customer')}
        </span>
        {!hideCustomer && <span className="block truncate text-small text-muted">{b.service_name}</span>}
        {b.note && <span className="mt-1 block truncate text-small text-muted">“{b.note}”</span>}
      </span>
      <ChevronRight size={20} className="self-center text-muted" />
    </Link>
  )
}
