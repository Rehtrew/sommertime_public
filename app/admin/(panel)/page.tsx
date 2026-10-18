import Link from 'next/link'
import { CalendarPlus, UserPlus, Scissors, ChevronRight } from 'lucide-react'
import { AdminBookingRow } from '@/components/AdminBookingRow'
import { query } from '@/lib/db'
import { bookingsBetween, windowsBetween } from '@/lib/data'
import { cap } from '@/lib/format'
import { addDays, fmtDate, fmtTime, startOfWeek, today, relativeDay } from '@/lib/time'

export default async function AdminHome() {
  const t = today()
  const [bookings, windows, [{ customers }]] = await Promise.all([
    bookingsBetween(t, addDays(t, 45)),
    windowsBetween(t, addDays(t, 90)),
    query<{ customers: number }>('SELECT count(*)::int AS customers FROM customers'),
  ])
  const todays = bookings.filter((b) => b.date === t)
  const later = bookings.filter((b) => b.date !== t)
  const weekEnd = addDays(startOfWeek(t), 6)
  const thisWeek = bookings.filter((b) => b.date <= weekEnd).length

  const laterByDate = new Map<string, typeof later>()
  for (const b of later) laterByDate.set(b.date, [...(laterByDate.get(b.date) ?? []), b])

  const openDays = new Map<string, typeof windows>()
  for (const w of windows) openDays.set(w.date, [...(openDays.get(w.date) ?? []), w])

  return (
    <>
      <div className="px-2 pt-4 pb-6 md:pt-2">
        <p className="text-[20px] text-muted">{cap(fmtDate(t))}</p>
        <h1 className="text-[48px] leading-none md:text-[72px]">Oversigt</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Link href="/admin/kalender" className="action-tile !bg-ink !text-white hover:opacity-90">
          <CalendarPlus size={22} strokeWidth={1.8} />
          Åbn tider
        </Link>
        <Link href="/admin/booking/ny" className="action-tile !bg-ink !text-white hover:opacity-90">
          <Scissors size={22} strokeWidth={1.8} />
          Book for kunde
        </Link>
        <Link href="/admin/kunder?ny=1" className="action-tile !bg-ink !text-white hover:opacity-90">
          <UserPlus size={22} strokeWidth={1.8} />
          Ny kunde
        </Link>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 md:mt-3 md:gap-3">
        <Stat label="I dag" value={todays.length} />
        <Stat label="Denne uge" value={thisWeek} />
        <Stat label="Kunder" value={customers} href="/admin/kunder" />
      </div>

      <div className="mt-3 grid items-start gap-3 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-[26px]">I dag</h2>
          {todays.length ? (
            <div className="flex flex-col gap-2">
              {todays.map((b) => (
                <AdminBookingRow key={b.id} b={b} />
              ))}
            </div>
          ) : (
            <p className="text-muted">Ingen bookinger i dag.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-[26px]">Kommende</h2>
          {laterByDate.size ? (
            <div className="flex flex-col gap-5">
              {[...laterByDate.entries()].slice(0, 8).map(([date, list]) => (
                <div key={date}>
                  <p className="mb-2 ml-1 text-[15px] text-muted">
                    {relativeDay(date)} · {fmtDate(date)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {list.map((b) => (
                      <AdminBookingRow key={b.id} b={b} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">Ingen kommende bookinger endnu.</p>
          )}
        </section>

        <section className="card lg:col-span-2">
          <h2 className="mb-1 text-[26px]">Åbne dage</h2>
          <p className="mb-4 text-[15px] text-muted">De dage kunderne kan booke.</p>
          {openDays.size ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {[...openDays.entries()].slice(0, 10).map(([date, ws]) => {
                const n = bookings.filter((b) => b.date === date).length
                return (
                  <li key={date}>
                    <Link
                      href={`/admin/kalender?date=${date}&dag=1`}
                      className="flex items-center justify-between gap-3 rounded-[20px] bg-tile p-4 hover:bg-tile-strong"
                    >
                      <span>
                        <span className="block text-[18px]">{cap(fmtDate(date))}</span>
                        <span className="block text-[15px] text-muted">
                          {ws.map((w) => `${fmtTime(w.start_min)}–${fmtTime(w.end_min)}`).join(', ')}
                          {n ? ` · ${n} booket` : ''}
                        </span>
                      </span>
                      <ChevronRight size={20} className="text-muted" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-[20px] bg-tile p-5">
              <p>Du har ingen åbne tider endnu.</p>
              <Link href="/admin/kalender" className="btn btn-sm mt-4">
                Åbn for booking
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <>
      <span className="block text-[15px] text-muted">{label}</span>
      <span className="block text-[40px] leading-none md:text-[52px]">{value}</span>
    </>
  )
  return href ? (
    <Link href={href} className="rounded-[24px] bg-card p-4 md:p-6">
      {inner}
    </Link>
  ) : (
    <div className="rounded-[24px] bg-card p-4 md:p-6">{inner}</div>
  )
}
