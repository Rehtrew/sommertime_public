import { adminMail, customerMail, dayCancelledMail, reminderMail, SICK_REASON, welcomeMail } from '@/lib/mail'
import { addDays, today } from '@/lib/time'
import { DEMO } from '@/lib/demo'

/**
 * Shows the emails in the browser, in development and in demo mode.
 * /api/mail-preview?type=reminder | welcome | new | moved | cancelled | customer-booked | customer-moved |
 *   customer-cancelled | day-cancelled | day-cancelled-custom
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production' && !DEMO) return new Response('Not found', { status: 404 })
  const type = new URL(req.url).searchParams.get('type') ?? 'reminder'
  const b = {
    id: 1,
    date: addDays(today(), 1),
    start_min: 660,
    end_min: 720,
    service_name: "Women's cut",
    price_from: 739,
    price_to: 895,
    note: 'A bit shorter than last time, please, and the fringe too.',
  }
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
              { date: addDays(today(), 8), start_min: 600 },
            )
          : type === 'welcome'
            ? welcomeMail('Ida Holm', 'ida@example.com')
            : reminderMail('Ida Holm', b)
  return new Response(mail.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
