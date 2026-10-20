import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { query, one } from '@/lib/db'
import { fmtPhone } from '@/lib/auth'
import { kr } from '@/lib/format'
import { addDays, daysBetween, fmtDateShort, fmtMonthName, nowCph, shiftMonth } from '@/lib/time'

export const metadata: Metadata = { title: 'Statistics' }

function monthLabel(ym: string) {
  return fmtMonthName(`${ym}-15`, 'short')
}

export default async function StatsPage() {
  const now = nowCph()
  const t = now.date
  const month = t.slice(0, 7)
  const year = t.slice(0, 4)
  const firstMonth = shiftMonth(month, -5)
  // "Past" = the appointment has started.
  const pastSql = `(b.date < $1 OR (b.date = $1 AND b.start_min <= $2))`

  const [totals, perMonth, topServices, topCustomers, lapsed] = await Promise.all([
    one<{
      customers: number
      new_customers: number
      month_bookings: number
      month_revenue: number
      year_revenue: number
      upcoming: number
      cancelled: number
    }>(
      `SELECT
        (SELECT count(*)::int FROM customers) AS customers,
        (SELECT count(*)::int FROM customers WHERE created_at > now() - interval '30 days') AS new_customers,
        (SELECT count(*)::int FROM bookings b WHERE b.status = 'booked' AND left(b.date, 7) = $3) AS month_bookings,
        (SELECT coalesce(sum(b.price_from), 0)::int FROM bookings b WHERE b.status = 'booked' AND left(b.date, 7) = $3) AS month_revenue,
        (SELECT coalesce(sum(b.price_from), 0)::int FROM bookings b WHERE b.status = 'booked' AND left(b.date, 4) = $4) AS year_revenue,
        (SELECT count(*)::int FROM bookings b WHERE b.status = 'booked' AND NOT ${pastSql}) AS upcoming,
        (SELECT count(*)::int FROM bookings b WHERE b.status = 'cancelled' AND left(b.date, 4) = $4) AS cancelled`,
      [t, now.min, month, year],
    ),
    query<{ ym: string; n: number; revenue: number }>(
      `SELECT left(date, 7) AS ym, count(*)::int AS n, coalesce(sum(price_from), 0)::int AS revenue
       FROM bookings WHERE status = 'booked' AND left(date, 7) >= $1 AND left(date, 7) <= $2 GROUP BY 1`,
      [firstMonth, month],
    ),
    query<{ name: string; n: number }>(
      `SELECT service_name AS name, count(*)::int AS n FROM bookings b
       WHERE b.status = 'booked' AND ${pastSql} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 6`,
      [t, now.min],
    ),
    query<{ id: number; name: string; avatar: string | null; n: number; spent: number }>(
      `SELECT c.id, c.name, c.avatar, count(*)::int AS n, coalesce(sum(b.price_from), 0)::int AS spent
       FROM bookings b JOIN customers c ON c.id = b.customer_id
       WHERE b.status = 'booked' AND ${pastSql} GROUP BY c.id ORDER BY 4 DESC, 5 DESC LIMIT 5`,
      [t, now.min],
    ),
    query<{ id: number; name: string; avatar: string | null; phone: string | null; last: string }>(
      `SELECT c.id, c.name, c.avatar, c.phone, max(b.date) AS last
       FROM customers c JOIN bookings b ON b.customer_id = c.id AND b.status = 'booked'
       GROUP BY c.id
       HAVING max(b.date) < $1
       ORDER BY max(b.date) LIMIT 8`,
      [addDays(t, -56)],
    ),
  ])

  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(firstMonth, i))
  const monthData = months.map((ym) => perMonth.find((r) => r.ym === ym) ?? { ym, n: 0, revenue: 0 })
  const maxMonth = Math.max(1, ...monthData.map((m) => m.n))
  const maxService = Math.max(1, ...topServices.map((s) => s.n))

  return (
    <>
      <div className="px-2 pt-4 pb-6 md:pt-2">
        <h1 className="text-display">Statistics</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
        <Tile label="Customers" value={String(totals!.customers)} sub={`${totals!.new_customers} new in the last 30 days`} />
        <Tile label="Bookings this month" value={String(totals!.month_bookings)} sub={`${totals!.upcoming} upcoming in total`} />
        <Tile label="Revenue this month" value={kr(totals!.month_revenue)} sub="Estimated from starting prices" />
        <Tile label={`Revenue ${year}`} value={kr(totals!.year_revenue)} sub="Estimated from starting prices" />
        <Tile label={`Cancellations ${year}`} value={String(totals!.cancelled)} sub="By customers or by you" />
      </div>

      <div className="mt-3 grid items-start gap-3 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-title">Bookings per month</h2>
          <p className="mb-6 text-small text-muted">The last 6 months, incl. upcoming appointments</p>
          <div className="flex h-48 items-end gap-2 border-b border-line" role="img" aria-label="Bar chart of bookings per month">
            {monthData.map((m) => (
              <div key={m.ym} className="flex h-full flex-1 flex-col items-center justify-end" title={`${monthLabel(m.ym)}: ${m.n} ${m.n === 1 ? 'booking' : 'bookings'} · ${kr(m.revenue)}`}>
                <span className="mb-1 text-small text-muted">{m.n}</span>
                <span
                  className={`w-full max-w-6 rounded-t-[4px] ${m.ym === month ? 'bg-ink' : 'bg-[#c9c9c9]'}`}
                  style={{ height: `${Math.max((m.n / maxMonth) * 85, m.n ? 3 : 0)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {monthData.map((m) => (
              <span key={m.ym} className={`flex-1 text-center text-small ${m.ym === month ? 'text-ink' : 'text-muted'}`}>
                {monthLabel(m.ym)}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>Bookings per month</caption>
            <tbody>
              {monthData.map((m) => (
                <tr key={m.ym}>
                  <th>{monthLabel(m.ym)}</th>
                  <td>{m.n}</td>
                  <td>{kr(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2 className="text-title">Popular treatments</h2>
          <p className="mb-5 text-small text-muted">Completed visits</p>
          {topServices.length ? (
            <ul className="flex flex-col gap-4">
              {topServices.map((s) => (
                <li key={s.name}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-small">
                    <span className="truncate">{s.name}</span>
                    <span className="shrink-0 text-muted">{s.n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-tile">
                    <div className="h-2 rounded-full bg-ink" style={{ width: `${(s.n / maxService) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No visits yet.</p>
          )}
        </section>

        <section className="card">
          <h2 className="text-title">Most loyal customers</h2>
          <p className="mb-4 text-small text-muted">Most visits</p>
          {topCustomers.length ? (
            <ul>
              {topCustomers.map((c, i) => (
                <li key={c.id}>
                  <Link href={`/admin/customers/${c.id}`} className="-mx-2 flex items-center gap-3 rounded-[18px] p-2 hover:bg-tile">
                    <span className="w-5 text-center text-small text-muted">{i + 1}</span>
                    <Avatar name={c.name} src={c.avatar} size={40} />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="shrink-0 text-right text-small text-muted">
                      {c.n} {c.n === 1 ? 'visit' : 'visits'}
                      <span className="block">{kr(c.spent)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No visits yet.</p>
          )}
        </section>

        <section className="card">
          <h2 className="text-title">Not seen for a while</h2>
          <p className="mb-4 text-small text-muted">Over 8 weeks since the last visit and no new appointment booked</p>
          {lapsed.length ? (
            <ul>
              {lapsed.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/customers/${c.id}`} className="-mx-2 flex items-center gap-3 rounded-[18px] p-2 hover:bg-tile">
                    <Avatar name={c.name} src={c.avatar} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{c.name}</span>
                      {c.phone && <span className="block text-small text-muted">{fmtPhone(c.phone)}</span>}
                    </span>
                    <span className="shrink-0 text-right text-small text-muted">
                      {Math.floor(daysBetween(c.last, t) / 7)} weeks
                      <span className="block">{fmtDateShort(c.last)}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Everyone has been in recently.</p>
          )}
        </section>
      </div>
    </>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[24px] bg-card p-4 md:p-6">
      <span className="block text-small leading-snug text-muted">{label}</span>
      <span className="mt-2 block text-title leading-none">{value}</span>
      <span className="mt-2 block text-small leading-snug text-muted">{sub}</span>
    </div>
  )
}
