import { adminMail, customerMail, dayCancelledMail, reminderMail, welcomeMail } from '@/lib/mail'
import { addDays, today } from '@/lib/time'
import { DEMO } from '@/lib/demo'

/**
 * Shows the emails in the browser, in development and in demo mode.
 * /api/mail-preview?type=reminder | velkommen | ny | flyttet | aflyst | kunde-booket | kunde-flyttet | kunde-aflyst | dag-aflyst | dag-aflyst-egen
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production' && !DEMO) return new Response('Ikke fundet', { status: 404 })
  const type = new URL(req.url).searchParams.get('type') ?? 'reminder'
  const b = {
    id: 1,
    date: addDays(today(), 1),
    start_min: 660,
    end_min: 720,
    service_name: 'Dameklip',
    price_from: 739,
    price_to: 895,
    note: 'Gerne lidt kortere end sidst, og pandehåret må gerne følge med.',
  }
  const mail =
    type === 'ny' || type === 'flyttet' || type === 'aflyst'
      ? adminMail(type, 'Anna Testesen', b)
      : type === 'kunde-booket' || type === 'kunde-flyttet' || type === 'kunde-aflyst'
        ? customerMail(type.slice(6) as 'booket' | 'flyttet' | 'aflyst', 'Anna Testesen', b)
        : type === 'dag-aflyst' || type === 'dag-aflyst-egen'
          ? dayCancelledMail(
              'Anna Testesen',
              { ...b, service_id: 1 },
              type === 'dag-aflyst' ? 'Sygdom' : 'Salonen er desværre lukket pga. en vandskade.',
              { date: addDays(today(), 8), start_min: 600 },
            )
          : type === 'velkommen'
          ? welcomeMail('Anna Testesen', 'anna@example.com')
          : reminderMail('Anna Testesen', b)
  return new Response(mail.html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
