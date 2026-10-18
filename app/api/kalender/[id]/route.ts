import { getCustomer, isAdmin } from '@/lib/auth'
import { getBooking } from '@/lib/data'
import { bookingIcs } from '@/lib/ics'
import { SALON_NAME, siteUrl } from '@/lib/mail'

export async function GET(_req: Request, ctx: RouteContext<'/api/kalender/[id]'>) {
  const { id } = await ctx.params
  const b = await getBooking(Number(id))
  const me = await getCustomer()
  if (!b || b.status !== 'booked' || (b.customer_id !== me?.id && !(await isAdmin()))) {
    return new Response('Ikke fundet', { status: 404 })
  }
  return new Response(bookingIcs(b, SALON_NAME, `${siteUrl()}/hjem`), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="booking-${b.date}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}
