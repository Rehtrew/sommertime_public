import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { DayPanel } from '@/components/DayPanel'
import { Drawer } from '@/components/Drawer'
import { LinkPending } from '@/components/LinkPending'
import { MonthPicker } from '@/components/MonthPicker'
import { bookingsBetween, windowsBetween, type Booking, type Window } from '@/lib/data'
import { cap, categoryColor } from '@/lib/format'
import {
  addDays,
  dayNumber,
  daysBetween,
  fmtDate,
  fmtHoursShort,
  fmtMonth,
  fmtTime,
  fmtWeekRange,
  fmtWeekdayShort,
  isDate,
  isoWeek,
  shiftMonth,
  startOfWeek,
  today,
} from '@/lib/time'

export const metadata: Metadata = { title: 'Kalender' }

const WEEKDAYS = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn']

type View = 'uge' | 'maaned'

export default async function CalendarPage(props: PageProps<'/admin/kalender'>) {
  const sp = await props.searchParams
  const t = today()
  const date = isDate(sp.date) ? sp.date : t
  const view: View = sp.vis === 'uge' ? 'uge' : 'maaned'
  const dayOpen = sp.dag === '1'
  const month = date.slice(0, 7)

  const href = (p: { date?: string; view?: View; day?: boolean } = {}) => {
    const q = new URLSearchParams()
    if ((p.view ?? view) === 'uge') q.set('vis', 'uge')
    q.set('date', p.date ?? date)
    if (p.day) q.set('dag', '1')
    return `/admin/kalender?${q}`
  }
  const dayHref = (d: string) => href({ date: d, day: true })
  // Jumping to another month lands on today if it is in that month, otherwise on the 1st.
  const monthStart = (m: string) => (t.startsWith(m) ? t : `${m}-01`)

  const from = view === 'uge' ? startOfWeek(date) : startOfWeek(`${month}-01`)
  const to = view === 'uge' ? addDays(from, 6) : addDays(startOfWeek(addDays(`${shiftMonth(month, 1)}-01`, -1)), 6)
  const days = Array.from({ length: daysBetween(from, to) + 1 }, (_, i) => addDays(from, i))
  const [windows, bookings] = await Promise.all([windowsBetween(from, to), bookingsBetween(from, to)])
  const byDay = (d: string) => ({
    wins: windows.filter((w) => w.date === d),
    books: bookings.filter((b) => b.date === d),
  })

  const prev = view === 'uge' ? href({ date: addDays(date, -7) }) : href({ date: monthStart(shiftMonth(month, -1)) })
  const next = view === 'uge' ? href({ date: addDays(date, 7) }) : href({ date: monthStart(shiftMonth(month, 1)) })

  // Month dropdown: a few months back and a year ahead.
  const thisMonth = t.slice(0, 7)
  const monthValues = Array.from({ length: 16 }, (_, i) => shiftMonth(thisMonth, i - 3))
  if (!monthValues.includes(month)) monthValues.push(month)
  monthValues.sort()
  const monthOptions = monthValues.map((m) => ({ value: m, label: cap(fmtMonth(`${m}-01`)) }))
  const monthHrefs = Object.fromEntries(monthValues.map((m) => [m, href({ date: monthStart(m) })]))

  const roundBtn = 'relative flex h-11 w-11 items-center justify-center rounded-full bg-tile hover:bg-tile-strong'

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 px-2 pt-4 pb-6 md:pt-2">
        <h1 className="text-[48px] leading-none md:text-[72px]">Kalender</h1>
        <nav className="flex rounded-full bg-card p-1" aria-label="Visning">
          {(
            [
              ['maaned', 'Måned'],
              ['uge', 'Uge'],
            ] as const
          ).map(([v, label]) => (
            <Link
              key={v}
              href={href({ view: v })}
              scroll={false}
              aria-current={view === v ? 'page' : undefined}
              className={`relative rounded-full px-5 py-2.5 text-[16px] transition-colors ${
                view === v ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {label}
              <LinkPending />
            </Link>
          ))}
        </nav>
      </div>

      <section className="card">
        <div className="mb-5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <MonthPicker value={month} options={monthOptions} hrefs={monthHrefs} />
            {view === 'uge' && (
              <p className="mt-0.5 text-[15px] text-muted">
                Uge {isoWeek(from)} · {fmtWeekRange(from, to)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            {(view === 'uge' ? !days.includes(t) : !t.startsWith(month)) && (
              <Link href={href({ date: t })} scroll={false} className="chip relative !min-h-11 max-sm:!hidden">
                I dag
                <LinkPending />
              </Link>
            )}
            <Link href={prev} scroll={false} className={roundBtn} aria-label={view === 'uge' ? 'Forrige uge' : 'Forrige måned'}>
              <ChevronLeft size={20} />
              <LinkPending />
            </Link>
            <Link href={next} scroll={false} className={roundBtn} aria-label={view === 'uge' ? 'Næste uge' : 'Næste måned'}>
              <ChevronRight size={20} />
              <LinkPending />
            </Link>
          </div>
        </div>

        {view === 'uge' ? (
          <WeekView days={days} today={t} byDay={byDay} dayHref={dayHref} />
        ) : (
          <MonthView days={days} month={month} today={t} selected={dayOpen ? date : null} byDay={byDay} dayHref={dayHref} />
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-[13px] text-muted">
          <span>Tryk på en dag for at se den og åbne den for booking.</span>
          <span className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[4px] bg-[#eef0fa]" /> Åben for booking
            </span>
            <Link href={href({ date: t })} scroll={false} className="flex items-center gap-1.5 hover:text-ink">
              <span className="h-3 w-3 rounded-[4px] ring-[1.5px] ring-ink ring-inset" /> I dag
            </Link>
          </span>
        </div>
      </section>

      {dayOpen && (
        <Drawer closeHref={href()} label={cap(fmtDate(date))}>
          <DayPanel
            date={date}
            prevHref={dayHref(addDays(date, -1))}
            nextHref={dayHref(addDays(date, 1))}
            closeHref={href()}
            selfHref={dayHref(date)}
            cancelNotice={
              typeof sp.aflyst === 'string' ? { cancelled: Number(sp.aflyst) || 0, mailed: Number(sp.mailet) || 0 } : undefined
            }
          />
        </Drawer>
      )}
    </>
  )
}

type DayData = (d: string) => { wins: Window[]; books: Booking[] }

function hours(wins: Window[]) {
  return fmtHoursShort(Math.min(...wins.map((w) => w.start_min)), Math.max(...wins.map((w) => w.end_min)))
}

function WeekView({
  days,
  today: t,
  byDay,
  dayHref,
}: {
  days: string[]
  today: string
  byDay: DayData
  dayHref: (d: string) => string
}) {
  return (
    <>
      {/* Desktop: one column per day with the customers listed downwards */}
      <div className="hidden grid-cols-7 gap-1.5 md:grid">
        {days.map((d) => {
          const { wins, books } = byDay(d)
          const past = d < t
          return (
            <div
              key={d}
              className={`flex min-h-64 min-w-0 flex-col gap-1.5 rounded-[20px] p-1.5 ${wins.length ? 'bg-[#eef0fa]' : 'bg-tile'} ${
                past ? 'opacity-55' : ''
              }`}
            >
              <Link href={dayHref(d)} scroll={false} className="relative flex items-center gap-2 rounded-[14px] px-2 py-1.5 hover:bg-white/70">
                <span className="text-[13px] text-muted">{fmtWeekdayShort(d)}</span>
                <span
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full px-1 text-[20px] ${
                    d === t ? 'bg-ink text-white' : ''
                  }`}
                >
                  {dayNumber(d)}
                </span>
                <LinkPending />
              </Link>
              {wins.length > 0 ? (
                <Link href={dayHref(d)} scroll={false} className="relative rounded-full bg-white px-2 py-1 text-center text-[13px] hover:bg-white/70">
                  {hours(wins)}
                  <LinkPending />
                </Link>
              ) : (
                !past && (
                  <Link
                    href={dayHref(d)}
                    scroll={false}
                    className="relative flex items-center justify-center gap-1 rounded-full border-[1.5px] border-dashed border-[#d0d0d0] px-2 py-0.5 text-[13px] text-muted hover:border-ink hover:text-ink"
                  >
                    <Plus size={14} /> Åbn
                    <LinkPending />
                  </Link>
                )
              )}
              {books.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/booking/${b.id}`}
                  className="relative block rounded-[12px] border-l-4 bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
                  style={{ borderLeftColor: categoryColor(b.category) }}
                >
                  <span className="block text-[12px] leading-tight text-muted">{fmtTime(b.start_min)}</span>
                  <span className="block truncate text-[14px] leading-snug">{b.customer_name ?? 'Slettet kunde'}</span>
                  <span className="block truncate text-[12px] leading-tight text-muted">{b.service_name}</span>
                  <LinkPending />
                </Link>
              ))}
            </div>
          )
        })}
      </div>

      {/* Phone: one row per day */}
      <ul className="flex flex-col gap-1.5 md:hidden">
        {days.map((d) => {
          const { wins, books } = byDay(d)
          const past = d < t
          return (
            <li key={d}>
              <Link
                href={dayHref(d)}
                scroll={false}
                className={`relative flex items-start gap-3 rounded-[20px] p-3 ${wins.length ? 'bg-[#eef0fa]' : 'bg-tile'} ${
                  past ? 'opacity-55' : ''
                }`}
              >
                <span className="flex w-11 shrink-0 flex-col items-center">
                  <span className="text-[13px] text-muted">{fmtWeekdayShort(d)}</span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[20px] ${d === t ? 'bg-ink text-white' : ''}`}
                  >
                    {dayNumber(d)}
                  </span>
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className={`block text-[15px] ${wins.length ? '' : 'text-muted'}`}>
                    {wins.length ? `Åben ${hours(wins)}` : past ? 'Lukket' : 'Lukket · tryk for at åbne'}
                  </span>
                  {books.map((b) => (
                    <span key={b.id} className="mt-1 flex items-center gap-2 text-[15px]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: categoryColor(b.category) }} />
                      <span className="shrink-0 text-muted">{fmtTime(b.start_min)}</span>
                      <span className="truncate">
                        {b.customer_name ?? 'Slettet kunde'} <span className="text-muted">· {b.service_name}</span>
                      </span>
                    </span>
                  ))}
                </span>
                <ChevronRight size={18} className="mt-3 shrink-0 text-muted" />
                <LinkPending />
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function MonthView({
  days,
  month,
  today: t,
  selected,
  byDay,
  dayHref,
}: {
  days: string[]
  month: string
  today: string
  selected: string | null
  byDay: DayData
  dayHref: (d: string) => string
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((w) => (
        <span key={w} className="pb-1 text-center text-[13px] text-muted lg:px-2.5 lg:text-left">
          {w}
        </span>
      ))}
      {days.map((d) => {
        const { wins, books } = byDay(d)
        const isSelected = d === selected
        const tone = isSelected ? 'bg-ink text-white' : wins.length ? 'bg-[#eef0fa] hover:bg-[#e3e6f7]' : 'hover:bg-tile'
        return (
          <Link
            key={d}
            href={dayHref(d)}
            scroll={false}
            className={`relative flex min-h-12 flex-col items-center rounded-[14px] py-1.5 transition-colors lg:min-h-[76px] lg:items-start lg:p-2.5 ${tone} ${
              d === t && !isSelected ? 'ring-[1.5px] ring-ink ring-inset' : ''
            } ${!d.startsWith(month) ? 'opacity-35' : d < t && !isSelected ? 'opacity-55' : ''}`}
          >
            <span className="text-[17px] leading-tight">{dayNumber(d)}</span>
            {books.length > 0 && (
              <span className="mt-1 flex items-center gap-1.5 text-[12px] leading-none">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink" />
                <span className="hidden lg:inline">{books.length}</span>
              </span>
            )}
            {wins.length > 0 && (
              <span className={`mt-auto hidden w-full truncate pt-1 text-[12px] lg:block ${isSelected ? 'text-white/70' : 'text-muted'}`}>
                {hours(wins)}
              </span>
            )}
            <LinkPending />
          </Link>
        )
      })}
    </div>
  )
}
