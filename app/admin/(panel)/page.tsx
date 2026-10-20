import Link from 'next/link'
import { CalendarPlus, UserPlus, Scissors, ChevronRight } from 'lucide-react'
import { AdminBookingRow } from '@/components/AdminBookingRow'
import { bookingsBetween, windowsBetween } from '@/lib/data'
import { cap } from '@/lib/format'
import { addDays, fmtDate, fmtTime, startOfWeek, today, relativeDay } from '@/lib/time'

const ACTIONS = [
  { href: '/admin/calendar', label: 'Opening hours', Icon: CalendarPlus },
  { href: '/admin/booking/new', label: 'Book for customer', Icon: Scissors },
  { href: '/admin/customers?new=1', label: 'New customer', Icon: UserPlus },
]

export default async function AdminHome() {
  const t = today()
  const [bookings, windows] = await Promise.all([bookingsBetween(t, addDays(t, 45)), windowsBetween(t, addDays(t, 90))])
  const weekEnd = addDays(startOfWeek(t), 6)
  const thisWeek = bookings.filter((b) => b.date <= weekEnd).length

  // Today always comes first, then the next three days that have bookings: the calendar has the rest.
  const byDate = new Map<string, typeof bookings>([[t, []]])
  for (const b of bookings) byDate.set(b.date, [...(byDate.get(b.date) ?? []), b])
  const days = [...byDate.entries()].slice(0, 4)

  const openDays = new Map<string, typeof windows>()
  for (const w of windows) openDays.set(w.date, [...(openDays.get(w.date) ?? []), w])

  return (
    <>
      <header className="px-2 pt-4 pb-6 md:pt-2">
        <p className="mb-2 text-muted">{cap(fmtDate(t))}</p>
        <h1 className="text-display">Overview</h1>
      </header>

      {/* Tiles on phones, a row of buttons on bigger screens */}
      <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap">
        {ACTIONS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="action-tile !bg-ink !text-white hover:opacity-90 md:min-h-14 md:flex-row md:gap-2.5 md:rounded-full md:px-6 md:text-body"
          >
            <Icon size={20} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-3 grid items-start gap-3 lg:grid-cols-[3fr_2fr]">
        <section className="card">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="text-title">Bookings</h2>
            <p className="text-small text-muted">{thisWeek} this week</p>
          </div>
          <div className="flex flex-col gap-6">
            {days.map(([date, list]) => (
              <div key={date}>
                <p className="mb-2 ml-1 text-small text-muted">
                  {date === t ? 'Today' : `${cap(relativeDay(date))} · ${fmtDate(date)}`}
                </p>
                {list.length ? (
                  <div className="flex flex-col gap-2">
                    {list.map((b) => (
                      <AdminBookingRow key={b.id} b={b} />
                    ))}
                  </div>
                ) : (
                  <p className="ml-1">No bookings.</p>
                )}
              </div>
            ))}
            {days.length === 1 && <p className="ml-1 text-muted">No upcoming bookings yet.</p>}
          </div>
        </section>

        <section className="card">
          <h2 className="mb-3 text-title">Open days</h2>
          {openDays.size ? (
            <ul>
              {[...openDays.entries()].slice(0, 10).map(([date, ws]) => {
                const n = bookings.filter((b) => b.date === date).length
                return (
                  <li key={date} className="border-t border-line first:border-0">
                    <Link
                      href={`/admin/calendar?date=${date}&day=1`}
                      className="-mx-3 flex items-center justify-between gap-3 rounded-[16px] px-3 py-3 transition-colors hover:bg-tile"
                    >
                      <span>
                        <span className="block">{cap(fmtDate(date))}</span>
                        <span className="block text-small text-muted">
                          {ws.map((w) => `${fmtTime(w.start_min)}–${fmtTime(w.end_min)}`).join(', ')}
                          {n ? ` · ${n} booked` : ''}
                        </span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-muted" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <>
              <p className="text-muted">You have no opening hours yet.</p>
              <Link href="/admin/calendar" className="btn btn-sm mt-4">
                Open for booking
              </Link>
            </>
          )}
        </section>
      </div>
    </>
  )
}
