import { adminMail, customerMail, dayCancelledMail, reminderMail, SICK_REASON, welcomeMail } from '@/lib/mail'
import { addDays, today } from '@/lib/time'
import { DEMO, DEMO_CUSTOMER_EMAIL } from '@/lib/demo'
import { one } from '@/lib/db'
import { freeSlots, type Booking } from '@/lib/data'

/**
 * Shows the emails in the browser, in development and in demo mode.
 * /api/mail-preview?type=reminder | welcome | new | moved | cancelled | customer-booked | customer-moved |
 *   customer-cancelled | day-cancelled | day-cancelled-custom
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production' && !DEMO) return new Response('Not found', { status: 404 })
  const type = new URL(req.url).searchParams.get('type') ?? 'reminder'
  // In the demo, show the demo customer's real next appointment and a real free time.
  const real = DEMO
    ? await one<Booking>(
        `SELECT b.* FROM bookings b JOIN customers c ON c.id = b.customer_id
         WHERE c.email = $1 AND b.status = 'booked' AND b.date >= $2 ORDER BY b.date, b.start_min LIMIT 1`,
        [DEMO_CUSTOMER_EMAIL, today()],
      )
    : undefined
  const sample = {
    id: 1,
    date: addDays(today(), 1),
    start_min: 660,
    end_min: 720,
    service_name: "Women's cut",
    price_from: 739,
    price_to: 895,
    note: 'A bit shorter than last time, please, and the fringe too.',
  }
  const b = real ? { ...real, note: real.note || sample.note } : sample
  // The cancelled day is closed, so the suggestion is on another day.
  const free = DEMO ? [...(await freeSlots(60)).entries()].find(([d]) => d !== b.date) : undefined
  const suggestion = free ? { date: free[0], start_min: free[1][0] } : { date: addDays(today(), 8), start_min: 600 }
  const mail =
    type === 'new' || type === 'moved' || type === 'cancelled'
      ? adminMail(type, 'Ida Holm', b)
      : type === 'customer-booked' || type === 'customer-moved' || type === 'customer-cancelled'
        ? customerMail(type.slice(9) as 'booked' | 'moved' | 'cancelled', 'Ida Holm', b)
        : type === 'day-cancelled' || type === 'day-cancelled-custom'
          ? dayCancelledMail(
              'Ida Holm',
              { ...b, service_id: 1 },
              type === 'day-cancelled' ? SICK_REASON : 'The salon is closed because of a water leak.',
              suggestion,
            )
          : type === 'welcome'
            ? welcomeMail('Ida Holm', 'ida@example.com')
            : reminderMail('Ida Holm', b)
  return new Response(mail.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
