import 'server-only'
import { query, one } from './db'
import { SLOT_STEP, nowCph, today, addDays, fmtTime } from './time'

export type Customer = {
  id: number
  name: string
  email: string | null
  phone: string | null
  password_hash: string | null
  avatar: string | null
  notes: string
  created_at: string | Date
}

export type Service = {
  id: number
  category: string
  name: string
  description: string
  duration_min: number
  price_from: number
  price_to: number | null
  sort_order: number
  active: boolean
}

export type Window = { id: number; date: string; start_min: number; end_min: number }

export type Booking = {
  id: number
  customer_id: number | null
  service_id: number | null
  service_name: string
  category: string
  price_from: number
  price_to: number | null
  date: string
  start_min: number
  end_min: number
  note: string
  status: 'booked' | 'cancelled'
  cancelled_by: 'customer' | 'salon' | null
  cancel_reason: string | null
  reminded: boolean
  customer_name?: string | null
}

/**
 * Categories in the order the hairdresser arranged them under Admin → Ydelser.
 * Expects services sorted by sort_order, as getServices returns them.
 */
export function categoriesInOrder(services: Pick<Service, 'category'>[]) {
  return [...new Set(services.map((s) => s.category))]
}

export async function getServices(includeInactive = false) {
  return query<Service>(
    `SELECT * FROM services ${includeInactive ? '' : 'WHERE active'} ORDER BY sort_order, id`,
  )
}

export async function getService(id: number) {
  return one<Service>('SELECT * FROM services WHERE id = $1', [id])
}

export async function getBooking(id: number) {
  return one<Booking>(
    `SELECT b.*, c.name AS customer_name FROM bookings b LEFT JOIN customers c ON c.id = b.customer_id WHERE b.id = $1`,
    [id],
  )
}

export async function bookingsForCustomer(customerId: number) {
  return query<Booking>(
    `SELECT * FROM bookings WHERE customer_id = $1 AND status = 'booked' ORDER BY date, start_min`,
    [customerId],
  )
}

export async function bookingsBetween(from: string, to: string) {
  return query<Booking>(
    `SELECT b.*, c.name AS customer_name FROM bookings b LEFT JOIN customers c ON c.id = b.customer_id
     WHERE b.date >= $1 AND b.date <= $2 AND b.status = 'booked' ORDER BY b.date, b.start_min`,
    [from, to],
  )
}

export async function windowsBetween(from: string, to: string) {
  return query<Window>('SELECT * FROM availability WHERE date >= $1 AND date <= $2 ORDER BY date, start_min', [from, to])
}

export function isUpcoming(b: Pick<Booking, 'date' | 'start_min'>) {
  const now = nowCph()
  return b.date > now.date || (b.date === now.date && b.start_min > now.min)
}

/** Merges overlapping opening hours into continuous ranges. */
function merge(ranges: [number, number][]) {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const out: [number, number][] = []
  for (const r of sorted) {
    const last = out[out.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else out.push([r[0], r[1]])
  }
  return out
}

export const BOOKING_HORIZON_DAYS = 120
const MIN_NOTICE_MIN = 60

/**
 * Free start times per date for a service of `duration` minutes,
 * inside the opening hours and around existing bookings.
 */
export async function freeSlots(duration: number, ignoreBookingId?: number) {
  const from = today()
  const to = addDays(from, BOOKING_HORIZON_DAYS)
  const [windows, bookings] = await Promise.all([windowsBetween(from, to), bookingsBetween(from, to)])
  const now = nowCph()
  const result = new Map<string, number[]>()

  const byDate = new Map<string, [number, number][]>()
  for (const w of windows) byDate.set(w.date, [...(byDate.get(w.date) ?? []), [w.start_min, w.end_min]])

  for (const [date, ranges] of byDate) {
    const taken = bookings.filter((b) => b.date === date && b.id !== ignoreBookingId)
    const times: number[] = []
    for (const [start, end] of merge(ranges)) {
      for (let t = start; t + duration <= end; t += SLOT_STEP) {
        if (date === now.date && t < now.min + MIN_NOTICE_MIN) continue
        if (taken.some((b) => t < b.end_min && t + duration > b.start_min)) continue
        times.push(t)
      }
    }
    if (times.length) result.set(date, times)
  }
  return new Map([...result.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

export async function findOverlap(date: string, start: number, end: number, ignoreBookingId?: number) {
  return one<Booking>(
    `SELECT b.*, c.name AS customer_name FROM bookings b LEFT JOIN customers c ON c.id = b.customer_id
     WHERE b.date = $1 AND b.status = 'booked' AND b.start_min < $3 AND b.end_min > $2 AND b.id <> $4 LIMIT 1`,
    [date, start, end, ignoreBookingId ?? 0],
  )
}

export function overlapMessage(b: Booking) {
  return `Overlapper med ${b.service_name}${b.customer_name ? ` (${b.customer_name})` : ''} kl. ${fmtTime(b.start_min)}–${fmtTime(b.end_min)}.`
}
