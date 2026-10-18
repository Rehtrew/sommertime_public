import Link from 'next/link'
import { categoryColor } from '@/lib/format'
import { fmtTime } from '@/lib/time'
import type { Booking, Window } from '@/lib/data'

const PX = 1.6 // pixels per minute

/** A vertical day view: opening hours as soft bands, bookings as cards on top. */
export function DayTimeline({ windows, bookings }: { windows: Window[]; bookings: Booking[] }) {
  const mins = [...windows.map((w) => w.start_min), ...bookings.map((b) => b.start_min), 9 * 60]
  const maxs = [...windows.map((w) => w.end_min), ...bookings.map((b) => b.end_min), 17 * 60]
  const start = Math.floor(Math.min(...mins) / 60) * 60
  const end = Math.ceil(Math.max(...maxs) / 60) * 60
  const hours = Array.from({ length: (end - start) / 60 + 1 }, (_, i) => start + i * 60)
  const y = (m: number) => (m - start) * PX

  return (
    <div className="relative" style={{ height: (end - start) * PX + 12 }}>
      {windows.map((w) => (
        <div
          key={`w${w.id}`}
          className="absolute right-0 left-14 rounded-[14px] bg-[#eef0fa]"
          style={{ top: y(w.start_min), height: (w.end_min - w.start_min) * PX }}
          aria-hidden
        />
      ))}
      {hours.map((h) => (
        <div key={h} className="absolute inset-x-0 flex items-start gap-3" style={{ top: y(h) }}>
          <span className="w-11 -translate-y-1/2 text-right text-[13px] text-muted">{fmtTime(h)}</span>
          <span className="flex-1 border-t border-line" />
        </div>
      ))}
      {bookings.map((b) => {
        const h = (b.end_min - b.start_min) * PX
        const short = b.end_min - b.start_min < 40
        return (
          <Link
            key={b.id}
            href={`/admin/booking/${b.id}`}
            className="absolute right-1.5 left-[3.9rem] overflow-hidden rounded-[12px] border-l-4 bg-white px-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.01]"
            style={{ top: y(b.start_min) + 1, height: h - 2, borderLeftColor: categoryColor(b.category) }}
          >
            {short ? (
              <span className="block truncate text-[14px] leading-[20px]">
                {fmtTime(b.start_min)} {b.customer_name ?? 'Deleted customer'} · <span className="text-muted">{b.service_name}</span>
              </span>
            ) : (
              <span className="block py-2 leading-tight">
                <span className="block text-[13px] text-muted">
                  {fmtTime(b.start_min)}–{fmtTime(b.end_min)}
                </span>
                <span className="block truncate text-[17px]">{b.customer_name ?? 'Deleted customer'}</span>
                <span className="block truncate text-[14px] text-muted">{b.service_name}</span>
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
