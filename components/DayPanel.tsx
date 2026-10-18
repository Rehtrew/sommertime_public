import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { CancelDayForm } from './CancelDayForm'
import { ActionForm } from './ActionForm'
import { DayTimeline } from './DayTimeline'
import { Field } from './Field'
import { LinkPending } from './LinkPending'
import { SubmitButton } from './SubmitButton'
import { query } from '@/lib/db'
import { isUpcoming, windowsBetween, type Booking } from '@/lib/data'
import { cap } from '@/lib/format'
import { fmtDate, fmtTime, today } from '@/lib/time'
import { addWindow, cancelDay, deleteWindow } from '@/app/actions/admin'

/** Everything about one day: its bookings and the opening hours customers can book within. */
export async function DayPanel({
  date,
  prevHref,
  nextHref,
  closeHref,
  selfHref,
  cancelNotice,
}: {
  date: string
  prevHref: string
  nextHref: string
  closeHref: string
  selfHref: string
  /** Shown right after the whole day was cancelled. */
  cancelNotice?: { cancelled: number; mailed: number }
}) {
  const [windows, bookings, cancelled] = await Promise.all([
    windowsBetween(date, date),
    query<Booking & { customer_email: string | null }>(
      `SELECT b.*, c.name AS customer_name, c.email AS customer_email FROM bookings b LEFT JOIN customers c ON c.id = b.customer_id
       WHERE b.date = $1 AND b.status = 'booked' ORDER BY b.start_min`,
      [date],
    ),
    query<Booking>(
      `SELECT b.*, c.name AS customer_name FROM bookings b LEFT JOIN customers c ON c.id = b.customer_id
       WHERE b.date = $1 AND b.status = 'cancelled' ORDER BY b.start_min`,
      [date],
    ),
  ])
  const past = date < today()
  const isOpen = windows.length > 0
  const upcoming = bookings.filter(isUpcoming)
  const roundBtn = 'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card hover:bg-tile-strong'

  const hoursCard = (
    <section className="card">
      <h3 className="text-[22px]">Opening hours</h3>
      <p className="mt-1 mb-4 text-[15px] text-muted">Customers can only book within the hours you open.</p>
      {isOpen && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {windows.map((w) => (
            <li key={w.id} className="flex items-center gap-1 rounded-full bg-[#eef0fa] py-1 pr-1 pl-4">
              {fmtTime(w.start_min)}–{fmtTime(w.end_min)}
              <form action={deleteWindow}>
                <input type="hidden" name="id" value={w.id} />
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white hover:text-danger"
                  aria-label={`Remove opening hours ${fmtTime(w.start_min)}–${fmtTime(w.end_min)}`}
                >
                  <X size={18} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {past ? (
        <p className="rounded-[18px] bg-tile px-4 py-3 text-muted">This day has passed.</p>
      ) : (
        <ActionForm action={addWindow} className="flex flex-col gap-3">
          <input type="hidden" name="date" value={date} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="From">
              <input className="input" type="time" name="start" defaultValue="10:00" step={900} required />
            </Field>
            <Field label="To">
              <input className="input" type="time" name="end" defaultValue="17:00" step={900} required />
            </Field>
          </div>
          <Field label="Repeat">
            <select name="repeat" className="input" defaultValue="0">
              <option value="0">This day only</option>
              <option value="1">Same time for 2 weeks</option>
              <option value="3">Same time for 4 weeks</option>
              <option value="7">Same time for 8 weeks</option>
              <option value="11">Same time for 12 weeks</option>
            </select>
          </Field>
          <SubmitButton className="btn mt-1" pendingText="Saving…">
            <Plus size={18} /> {isOpen ? 'Add more opening hours' : 'Open the day for booking'}
          </SubmitButton>
        </ActionForm>
      )}
    </section>
  )

  const bookingsCard = (
    <section className="card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[22px]">
          Bookings <span className="text-muted">{bookings.length || ''}</span>
        </h3>
        <Link href={`/admin/booking/new?date=${date}`} className="btn btn-sm relative">
          <Plus size={18} /> Book
          <LinkPending />
        </Link>
      </div>
      {isOpen || bookings.length ? (
        <DayTimeline windows={windows} bookings={bookings} />
      ) : (
        <p className="text-muted">No bookings.</p>
      )}
      {cancelled.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-[15px] text-muted">Cancelled appointments</p>
          <ul className="flex flex-col gap-2 text-[15px] text-muted">
            {cancelled.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/booking/${b.id}`} className="hover:text-ink">
                  <span className="line-through decoration-1">
                    {fmtTime(b.start_min)} {b.customer_name ?? 'Deleted customer'} · {b.service_name}
                  </span>
                  <span className="block text-[13px]">
                    {b.cancelled_by === 'salon' ? `Cancelled by you${b.cancel_reason ? `: ${b.cancel_reason}` : ''}` : 'Cancelled by the customer'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 px-2 pt-2">
        <div className="min-w-0">
          <h2 className="text-[30px] leading-tight">{cap(fmtDate(date))}</h2>
          <p className="mt-2">
            {isOpen ? (
              <span className="inline-flex rounded-full bg-[#eef0fa] px-3 py-1 text-[15px]">
                Open {windows.map((w) => `${fmtTime(w.start_min)}–${fmtTime(w.end_min)}`).join(', ')}
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-card px-3 py-1 text-[15px] text-muted">Closed for booking</span>
            )}
          </p>
        </div>
        <Link href={closeHref} scroll={false} className={roundBtn} aria-label="Close">
          <X size={20} />
        </Link>
      </div>

      <div className="flex gap-2 px-2">
        <Link href={prevHref} scroll={false} className="chip relative !bg-card">
          <ChevronLeft size={18} /> Previous day
          <LinkPending />
        </Link>
        <Link href={nextHref} scroll={false} className="chip relative !bg-card">
          Next day <ChevronRight size={18} />
          <LinkPending />
        </Link>
      </div>

      {cancelNotice && (
        <div className="fade-in flex items-start gap-3 rounded-[24px] bg-ok-tile p-4 text-ok">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ok text-white">
            <Check size={18} />
          </span>
          <p className="text-[16px] leading-snug">
            The day is cancelled and closed for booking.
            {cancelNotice.cancelled > 0 &&
              ` ${cancelNotice.cancelled} ${cancelNotice.cancelled === 1 ? 'appointment was' : 'appointments were'} cancelled.`}
            {cancelNotice.mailed > 0 &&
              ` ${cancelNotice.mailed} ${cancelNotice.mailed === 1 ? 'customer has' : 'customers have'} been emailed a suggested new time.`}
            {cancelNotice.cancelled > 0 &&
              cancelNotice.mailed < cancelNotice.cancelled &&
              (cancelNotice.mailed === 0 ? ' No emails were sent, so let the customers know yourself.' : ' Let the rest know yourself.')}
          </p>
        </div>
      )}

      {/* A closed, empty day is mostly about opening it; otherwise the bookings come first. */}
      {!isOpen && bookings.length === 0 ? (
        <>
          {hoursCard}
          {bookingsCard}
        </>
      ) : (
        <>
          {bookingsCard}
          {hoursCard}
        </>
      )}

      {!past && (isOpen || upcoming.length > 0) && (
        <CancelDayForm
          action={cancelDay}
          date={date}
          back={selfHref}
          count={upcoming.length}
          emailCount={upcoming.filter((b) => b.customer_email).length}
          dayLabel={fmtDate(date)}
        />
      )}
    </div>
  )
}
