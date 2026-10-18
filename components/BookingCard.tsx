import Link from 'next/link'
import { ArrowUpRight, CalendarPlus, MapPin, Pencil, Trash2 } from 'lucide-react'
import { SALON } from '@/lib/salon'
import { cancelBooking } from '@/app/actions/customer'
import { fmtDateShort, fmtDuration, fmtTime, relativeDay, fmtDate } from '@/lib/time'
import { priceRange } from '@/lib/format'
import type { Booking } from '@/lib/data'
import { LinkPending } from '@/components/LinkPending'

export function BookingCard({ b, confirmCancel }: { b: Booking; confirmCancel: boolean }) {
  return (
    <article className="card fade-in">
      <p className="text-[28px] leading-tight text-muted md:text-[32px]">{relativeDay(b.date)}</p>
      <h2 className="mt-1 text-[34px] leading-[1.05] md:text-[44px]">{b.service_name}</h2>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <a href={`/api/calendar/${b.id}`} className="action-tile">
          <CalendarPlus size={22} strokeWidth={1.8} />
          Calendar
        </a>
        <Link href={`/book?move=${b.id}`} className="action-tile relative">
          <Pencil size={22} strokeWidth={1.8} />
          Reschedule
          <LinkPending />
        </Link>
        <Link href={confirmCancel ? '/home' : `/home?cancel=${b.id}`} scroll={false} className="action-tile danger relative">
          <Trash2 size={22} strokeWidth={1.8} />
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

      <div className="dashed mt-6 grid grid-cols-2">
        <div className="border-r-[1.5px] border-dashed border-line px-2 pt-5 text-center">
          <p className="text-[15px] text-muted">Date and time</p>
          <p className="mt-1 text-[24px] leading-tight">
            {fmtTime(b.start_min)}–{fmtTime(b.end_min)}
          </p>
          <p className="text-[15px] text-muted">{fmtDateShort(b.date)}</p>
        </div>
        <div className="px-2 pt-5 text-center">
          <p className="text-[15px] text-muted">Duration</p>
          <p className="mt-1 text-[24px] leading-tight">{fmtDuration(b.end_min - b.start_min)}</p>
          <p className="text-[15px] text-muted">{priceRange(b.price_from, b.price_to)}</p>
        </div>
      </div>
      {b.note && <p className="mt-5 rounded-[18px] bg-tile px-4 py-3 text-[16px] text-muted">“{b.note}”</p>}
      <a
        href={SALON.mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-3 rounded-[18px] bg-tile px-4 py-3 transition-colors hover:bg-tile-strong"
      >
        <MapPin size={20} strokeWidth={1.8} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] text-muted">Location</span>
          <span className="block">{SALON.address}</span>
        </span>
        <ArrowUpRight size={18} className="shrink-0 text-muted" />
      </a>
    </article>
  )
}
