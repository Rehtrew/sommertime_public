import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { SALON } from '@/lib/salon'
import { cancelBooking } from '@/app/actions/customer'
import { fmtDuration, fmtTime, relativeDay, fmtDate } from '@/lib/time'
import { cap, priceRange } from '@/lib/format'
import type { Booking } from '@/lib/data'
import { LinkPending } from '@/components/LinkPending'

export function BookingCard({ b, confirmCancel }: { b: Booking; confirmCancel: boolean }) {
  return (
    <article className="card fade-in">
      <p className="mb-1 text-small text-muted">{relativeDay(b.date)}</p>
      <h2 className="text-title">{b.service_name}</h2>

      <dl className="mt-5">
        <Row label="Date">{cap(fmtDate(b.date))}</Row>
        <Row label="Time">
          {fmtTime(b.start_min)}–{fmtTime(b.end_min)} · {fmtDuration(b.end_min - b.start_min)}
        </Row>
        <Row label="Price">{priceRange(b.price_from, b.price_to)}</Row>
        <Row label="Where">
          <a href={SALON.mapsHref} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
            {SALON.address}
            <ArrowUpRight size={16} className="ml-1 inline align-[-2px] text-muted" />
          </a>
        </Row>
        {b.note && <Row label="Note">“{b.note}”</Row>}
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href={`/api/calendar/${b.id}`} className="btn btn-soft btn-sm">
          Calendar
        </a>
        <Link href={`/book?move=${b.id}`} className="btn btn-soft btn-sm relative">
          Reschedule
          <LinkPending />
        </Link>
        <Link href={confirmCancel ? '/home' : `/home?cancel=${b.id}`} scroll={false} className="btn btn-danger btn-sm relative">
          Cancel
          <LinkPending />
        </Link>
      </div>

      {confirmCancel && (
        <form action={cancelBooking} className="mt-3">
          <input type="hidden" name="id" value={b.id} />
          <div className="fade-in rounded-[22px] bg-danger-tile p-4">
            <p className="mb-3 text-danger">
              Cancel {b.service_name.toLowerCase()} on {fmtDate(b.date)} at {fmtTime(b.start_min)}?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/home" scroll={false} className="btn btn-white btn-sm">
                No
              </Link>
              <button type="submit" className="btn btn-sm !bg-danger">
                Yes, cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </article>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 border-t border-line py-3">
      <dt className="w-16 shrink-0 text-small text-muted">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  )
}
