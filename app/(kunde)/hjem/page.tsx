import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, CalendarPlus, Check, MapPin, MessageCircle, Phone } from 'lucide-react'
import { SALON } from '@/lib/salon'
import { BookingCard } from '@/components/BookingCard'
import { FlowVideo } from '@/components/FlowVideo'
import { requireCustomer } from '@/lib/auth'
import { query } from '@/lib/db'
import { bookingsForCustomer, isUpcoming, type Booking } from '@/lib/data'
import { cap, firstName } from '@/lib/format'
import { fmtDate, fmtDateShort, fmtTime, today } from '@/lib/time'
import { LinkPending } from '@/components/LinkPending'

export const metadata: Metadata = { title: 'Mine tider' }

export default async function HomePage(props: PageProps<'/hjem'>) {
  const me = await requireCustomer()
  const sp = await props.searchParams
  const [all, salonCancelled] = await Promise.all([
    bookingsForCustomer(me.id),
    query<Booking>(
      `SELECT * FROM bookings WHERE customer_id = $1 AND status = 'cancelled' AND cancelled_by = 'salon' AND date >= $2
       ORDER BY date, start_min`,
      [me.id, today()],
    ),
  ])
  const upcoming = all.filter(isUpcoming)
  const past = all.filter((b) => !isUpcoming(b)).reverse()

  const justBooked = Number(sp.booket || sp.flyttet) || 0
  const cancelId = Number(sp.aflys) || 0

  return (
    <>
      <h1 className="px-2 pt-6 pb-6 text-[48px] leading-none md:pt-10 md:text-[72px]">
        <span className="text-muted">Hej</span> {firstName(me.name)}
      </h1>

      {justBooked > 0 && (
        <div className="fade-in mb-3 flex items-center gap-4 rounded-[28px] bg-ok-tile p-5 text-ok">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ok text-white">
            <Check size={22} />
          </span>
          <p className="flex-1 text-[19px] leading-snug">{sp.flyttet ? 'Din tid er flyttet.' : 'Din tid er booket.'}</p>
          <a href={`/api/kalender/${justBooked}`} className="btn btn-white btn-sm shrink-0 !text-ok">
            <CalendarPlus size={18} /> Kalender
          </a>
        </div>
      )}
      {!me.email && (
        <Link href="/profil" className="mb-3 flex items-center justify-between gap-4 rounded-[28px] bg-card p-5">
          <span className="text-[17px] leading-snug">Tilføj din e-mail, så du får bekræftelser og påmindelser.</span>
          <ArrowRight size={20} className="shrink-0" />
        </Link>
      )}
      {salonCancelled.map((b) => (
        <div key={b.id} className="fade-in mb-3 rounded-[28px] bg-danger-tile p-5">
          <p className="text-[15px] text-danger">Din tid er aflyst</p>
          <p className="mt-1 text-[22px] leading-tight">{b.service_name}</p>
          <p className="text-muted line-through decoration-1">
            {cap(fmtDate(b.date))} kl. {fmtTime(b.start_min)}
          </p>
          <p className="mt-2 text-[16px]">
            {b.cancel_reason === 'Sygdom' ? 'Din frisør er desværre blevet syg.' : b.cancel_reason ? `Årsag: ${b.cancel_reason}` : ''}
          </p>
          <Link href={b.service_id ? `/book?service=${b.service_id}#dato` : '/book'} className="btn btn-sm relative mt-4">
            Book en ny tid
            <LinkPending />
          </Link>
        </div>
      ))}
      {sp.aflyst && (
        <p className="fade-in mb-3 rounded-[28px] bg-card p-5 text-[19px] text-muted">Din tid er aflyst.</p>
      )}

      <div className="flex flex-col gap-3">
        {upcoming.map((b) => (
          <BookingCard key={b.id} b={b} confirmCancel={cancelId === b.id} />
        ))}

        <Link
          href="/book"
          className="group relative block h-56 overflow-hidden rounded-[28px] bg-lilac transition-transform active:scale-[0.99] md:h-72"
        >
          <FlowVideo className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
          <LinkPending />
          <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-[22px] bg-white/80 py-3 pr-3 pl-5 backdrop-blur-md">
            <span className="text-[26px] leading-tight md:text-[30px]">
              {upcoming.length ? 'Book en tid mere' : 'Book en tid'}
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
              <ArrowRight size={22} />
            </span>
          </span>
        </Link>

        {upcoming.length === 0 && (
          <p className="px-3 pt-2 text-[17px] text-muted">Du har ingen kommende tider lige nu.</p>
        )}

        <section className="card">
          <h2 className="text-[24px]">Kontakt</h2>
          <p className="mt-1 text-muted">
            {SALON.address}
            <br />
            Tlf. {SALON.phone}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <a href={SALON.phoneHref} className="action-tile">
              <Phone size={22} strokeWidth={1.8} />
              Ring
            </a>
            <a href={SALON.smsHref} className="action-tile">
              <MessageCircle size={22} strokeWidth={1.8} />
              SMS
            </a>
            <a href={SALON.mapsHref} target="_blank" rel="noopener noreferrer" className="action-tile">
              <MapPin size={22} strokeWidth={1.8} />
              Find vej
            </a>
          </div>
        </section>

        {past.length > 0 && (
          <section className="card mt-3">
            <h2 className="mb-3 text-[24px]">Tidligere besøg</h2>
            <ul>
              {past.slice(0, 12).map((b) => (
                <li key={b.id} className="flex items-baseline justify-between gap-4 border-t border-line py-3 first:border-0">
                  <span>{b.service_name}</span>
                  <span className="shrink-0 text-[15px] text-muted">
                    {fmtDateShort(b.date)} · {fmtTime(b.start_min)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
