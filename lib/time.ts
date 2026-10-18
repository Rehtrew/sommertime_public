// All dates are stored as 'YYYY-MM-DD' and times as minutes after midnight,
// in the salon's local time (Copenhagen). That keeps the calendar free of time zone surprises.

export const TZ = 'Europe/Copenhagen'
export const SLOT_STEP = 15

function parts(d: Date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (t: string) => p.find((x) => x.type === t)!.value
  return { date: `${get('year')}-${get('month')}-${get('day')}`, min: Number(get('hour')) * 60 + Number(get('minute')) }
}

export function nowCph() {
  return parts(new Date())
}

export function today() {
  return nowCph().date
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Moves a 'YYYY-MM' month string n months forward or back. */
export function shiftMonth(ym: string, n: number) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + n, 15)).toISOString().slice(0, 7)
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000)
}

export function weekday(date: string) {
  // 0 = monday
  return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7
}

export function startOfWeek(date: string) {
  return addDays(date, -weekday(date))
}

export function isDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
}

export function fmtTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

export function parseTime(s: unknown) {
  if (typeof s !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return null
  const v = Number(m[1]) * 60 + Number(m[2])
  return v >= 0 && v <= 24 * 60 ? v : null
}

function fmt(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(new Date(`${date}T12:00:00Z`))
}

/** "Tuesday 20 October" */
export function fmtDate(date: string) {
  return fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "20 Oct 2026" */
export function fmtDateShort(date: string) {
  return fmt(date, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "October 2026" */
export function fmtMonth(date: string) {
  return fmt(date, { month: 'long', year: 'numeric' })
}

/** "Tue" */
export function fmtWeekdayShort(date: string) {
  return fmt(date, { weekday: 'short' }).replace('.', '')
}

export function dayNumber(date: string) {
  return Number(date.slice(8, 10))
}

/** "Today", "Tomorrow", "In 3 days", "In a week" … */
export function relativeDay(date: string) {
  const n = daysBetween(today(), date)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n > 1 && n < 7) return `In ${n} days`
  if (n >= 7 && n < 14) return 'In a week'
  if (n >= 14) return `In ${Math.floor(n / 7)} weeks`
  return fmtDateShort(date)
}

export function fmtDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} hour${h > 1 ? 's' : ''}`
}

/** Converts Danish local date + minutes to a UTC Date (for calendar files). */
export function toUtc(date: string, min: number) {
  const guess = Date.parse(`${date}T${fmtTime(min)}:00Z`)
  const local = parts(new Date(guess))
  const localMs = Date.parse(`${local.date}T${fmtTime(local.min)}:00Z`)
  return new Date(guess - (localMs - guess))
}

export function isPast(date: string, min: number) {
  const now = nowCph()
  return date < now.date || (date === now.date && min <= now.min)
}

/** ISO week number, as used in Danish calendars. */
export function isoWeek(date: string) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - weekday(date) + 3) // the Thursday decides which year the week belongs to
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1, 12)
  return Math.floor((d.getTime() - yearStart) / 86400000 / 7) + 1
}

/** "October" or "Oct" */
export function fmtMonthName(date: string, style: 'long' | 'short' = 'long') {
  return fmt(date, { month: style }).replace('.', '')
}

/** "12–18 October" or "28 Sep–4 Oct" */
export function fmtWeekRange(from: string, to: string) {
  return from.slice(0, 7) === to.slice(0, 7)
    ? `${dayNumber(from)}–${dayNumber(to)} ${fmtMonthName(to)}`
    : `${dayNumber(from)} ${fmtMonthName(from, 'short')}–${dayNumber(to)} ${fmtMonthName(to, 'short')}`
}

/** "10–17" when on the hour, otherwise "10:30–17" */
export function fmtHoursShort(start: number, end: number) {
  const f = (m: number) => (m % 60 ? fmtTime(m) : String(m / 60))
  return `${f(start)}–${f(end)}`
}
