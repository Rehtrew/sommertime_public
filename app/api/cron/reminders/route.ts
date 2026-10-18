import { query } from '@/lib/db'
import { mailEnabled, reminderMail, sendMail } from '@/lib/mail'
import { addDays, today } from '@/lib/time'
import type { Booking } from '@/lib/data'

/**
 * Runs once a day via Vercel Cron (see vercel.json, free on the Hobby plan).
 * Emails customers who have a time tomorrow. Does nothing until SMTP is configured.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  if (!mailEnabled()) return Response.json({ sent: 0, note: 'SMTP er ikke sat op' })

  const tomorrow = addDays(today(), 1)
  const rows = await query<Booking & { name: string; email: string }>(
    `SELECT b.*, c.name, c.email FROM bookings b JOIN customers c ON c.id = b.customer_id
     WHERE b.date = $1 AND b.status = 'booked' AND NOT b.reminded AND c.email IS NOT NULL`,
    [tomorrow],
  )
  let sent = 0
  for (const b of rows) {
    try {
      await sendMail(b.email, reminderMail(b.name, b))
      await query('UPDATE bookings SET reminded = true WHERE id = $1', [b.id])
      sent++
    } catch (err) {
      console.error('Påmindelse fejlede', b.id, err)
    }
  }
  return Response.json({ sent })
}
