// Demo mode: with no database configured, the app runs on an in-memory Postgres
// filled with made-up sample data. Everything resets when the server restarts.

import { SEED_SERVICES } from './seed'
import { addDays, today, weekday } from './time'

export const DEMO = !(process.env.DATABASE_URL || process.env.POSTGRES_URL)

/** The customer you become with "Se som kunde". */
export const DEMO_CUSTOMER_EMAIL = 'ida@example.com'

type Query = (text: string, params?: unknown[]) => Promise<unknown>

// All people, emails and numbers are invented. Numbers starting with 1 are not used for Danish subscribers.
const CUSTOMERS: { name: string; email: string | null; phone: string | null; notes: string; prefs: number[]; lapsed?: boolean }[] = [
  { name: 'Ida Holm', email: DEMO_CUSTOMER_EMAIL, phone: '+4512345601', notes: 'Farve 8.1 + 6 % i bunden, 35 min. Kort i nakken.', prefs: [0, 14] },
  { name: 'Freja Lund', email: 'freja@example.com', phone: null, notes: 'Balayage hvert halve år. Følsom hovedbund.', prefs: [5, 6, 0] },
  { name: 'Mads Kjær', email: 'mads@example.com', phone: '+4512345603', notes: '', prefs: [2, 3] },
  { name: 'Sofie Bak', email: 'sofie@example.com', phone: '+4512345604', notes: 'Pandehår hver 4. uge.', prefs: [1, 0] },
  { name: 'Emil Krogh', email: 'emil@example.com', phone: null, notes: 'Nr. 2 på siderne.', prefs: [4, 2] },
  { name: 'Clara Vinter', email: 'clara@example.com', phone: '+4512345606', notes: '', prefs: [0, 11] },
  { name: 'Noah Friis', email: null, phone: '+4512345607', notes: 'Har ingen e-mail. Ring hellere.', prefs: [2] },
  { name: 'Alma Dahl', email: 'alma@example.com', phone: null, notes: 'Reflekser, toning 9.12.', prefs: [7, 9, 0] },
  { name: 'Karla Bech', email: 'karla@example.com', phone: '+4512345609', notes: '', prefs: [0, 12] },
  { name: 'Oscar Lind', email: 'oscar@example.com', phone: null, notes: '', prefs: [2, 3] },
  { name: 'Asta Møller', email: 'asta@example.com', phone: '+4512345611', notes: '', prefs: [0], lapsed: true },
  { name: 'Viggo Brandt', email: 'viggo@example.com', phone: null, notes: '', prefs: [2], lapsed: true },
]

const NOTES = ['Gerne lidt kortere end sidst.', 'Jeg kommer måske 5 min. for sent.', 'Vil gerne prøve noget nyt!']

/** Small seeded random generator, so the sample data looks the same every time. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export async function seedDemo(query: Query) {
  const random = rng(7)
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)]
  const t = today()

  // Customers, with ids 1..n in this order.
  for (const [i, c] of CUSTOMERS.entries()) {
    await query(
      `INSERT INTO customers (name, email, phone, notes, created_at) VALUES ($1, $2, $3, $4, now() - ($5 || ' days')::interval)`,
      [c.name, c.email, c.phone, c.notes, String(i < 2 ? 10 + i * 5 : 40 + i * 9)],
    )
  }

  // Opening hours: tuesday to saturday, three months back and four weeks ahead.
  const openDays: string[] = []
  for (let d = addDays(t, -90); d <= addDays(t, 28); d = addDays(d, 1)) {
    const wd = weekday(d)
    if (wd < 1 || wd > 5) continue
    openDays.push(d)
    await query('INSERT INTO availability (date, start_min, end_min) VALUES ($1, $2, $3)', [d, 600, wd === 5 ? 840 : 1020])
  }

  const taken = new Map<string, [number, number][]>()
  const free = (d: string, s: number, e: number) => !(taken.get(d) ?? []).some(([a, b]) => s < b && e > a)
  const add = async (customer: number, serviceIndex: number, d: string, start: number, extra: Partial<{ status: string; note: string }> = {}) => {
    const s = SEED_SERVICES[serviceIndex]
    const end = start + s.duration
    taken.set(d, [...(taken.get(d) ?? []), [start, end]])
    await query(
      `INSERT INTO bookings (customer_id, service_id, service_name, category, price_from, price_to, date, start_min, end_min, note, status, cancelled_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        customer,
        serviceIndex + 1,
        s.name,
        s.category,
        s.from,
        s.to ?? null,
        d,
        start,
        end,
        extra.note ?? '',
        extra.status ?? 'booked',
        extra.status === 'cancelled' ? 'customer' : null,
      ],
    )
  }

  // Ida, the demo customer: two upcoming times and a few past visits.
  const firstOpenFrom = (d: string) => openDays.find((x) => x >= d)!
  await add(1, 0, firstOpenFrom(addDays(t, 2)), 660, { note: NOTES[0] })
  await add(1, 14, firstOpenFrom(addDays(t, 15)), 840)
  for (const back of [-12, -40, -68]) await add(1, back === -40 ? 14 : 0, firstOpenFrom(addDays(t, back)), 720)

  // Everyone else fills the days: busy in the past, with free spots ahead.
  for (const d of openDays) {
    const end = weekday(d) === 5 ? 840 : 1020
    const ahead = d >= t
    const load = !ahead ? 0.62 : d <= addDays(t, 7) ? 0.42 : 0.25
    let pointer = 600
    while (pointer < end) {
      if (random() > load) {
        pointer += 30
        continue
      }
      const pool = CUSTOMERS.map((c, i) => ({ ...c, id: i + 1 })).filter(
        (c) => c.id !== 1 && (c.lapsed ? d < addDays(t, -60) : true),
      )
      const c = pick(pool)
      const serviceIndex = pick(c.prefs)
      const duration = SEED_SERVICES[serviceIndex].duration
      if (pointer + duration > end) break
      if (free(d, pointer, pointer + duration)) {
        const cancelled = ahead && random() < 0.06
        await add(c.id, serviceIndex, d, pointer, {
          status: cancelled ? 'cancelled' : 'booked',
          note: random() < 0.08 ? pick(NOTES) : '',
        })
      }
      pointer += duration + (random() < 0.3 ? 15 : 0)
    }
  }
}
