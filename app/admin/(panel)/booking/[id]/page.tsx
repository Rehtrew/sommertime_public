import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarPlus } from 'lucide-react'
import { AdminBookingForm } from '@/components/AdminBookingForm'
import { ConfirmButton } from '@/components/ConfirmButton'
import { getBooking, isUpcoming } from '@/lib/data'
import { cap } from '@/lib/format'
import { fmtDate, fmtTime } from '@/lib/time'
import { deleteBooking } from '@/app/actions/admin'

export const metadata: Metadata = { title: 'Booking' }

export default async function EditBookingPage(props: PageProps<'/admin/booking/[id]'>) {
  const { id } = await props.params
  const b = await getBooking(Number(id))
  if (!b) notFound()

  return (
    <div className="mx-auto max-w-xl">
      <div className="px-2 pt-4">
        <Link
          href={`/admin/calendar?date=${b.date}&day=1`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>
      <div className="px-2 pt-5 pb-6">
        <p className="text-body text-muted">
          {cap(fmtDate(b.date))} at {fmtTime(b.start_min)}
        </p>
        <h1 className="text-display">
          {b.customer_id ? (
            <Link href={`/admin/customers/${b.customer_id}`} className="hover:underline">
              {b.customer_name}
            </Link>
          ) : (
            'Deleted customer'
          )}
        </h1>
      </div>

      {b.status === 'cancelled' && (
        <p className="mb-3 rounded-[24px] bg-danger-tile p-5 text-danger">
          {b.cancelled_by === 'salon'
            ? `You cancelled this appointment${b.cancel_reason ? ` (${b.cancel_reason})` : ''}.`
            : 'The customer cancelled this appointment.'}{' '}
          Save to reactivate it.
        </p>
      )}

      <section className="card">
        <AdminBookingForm booking={b} />
      </section>

      <section className="card mt-3 flex flex-col gap-3">
        {b.status === 'booked' && (
          <a href={`/api/calendar/${b.id}`} className="btn btn-soft">
            <CalendarPlus size={18} /> Add to my calendar
          </a>
        )}
        <form action={deleteBooking} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={b.id} />
          {b.status === 'booked' && isUpcoming(b) && (
            <label className="flex items-start gap-3 px-1">
              <input type="checkbox" name="notify" defaultChecked className="mt-0.5 h-6 w-6 shrink-0 accent-ink" />
              <span>
                Email the customer if I delete the appointment
                <span className="block text-small text-muted">Only if the customer has an email.</span>
              </span>
            </label>
          )}
          <ConfirmButton confirmText="The booking will be deleted completely." confirmLabel="Delete">
            Delete booking
          </ConfirmButton>
        </form>
      </section>
    </div>
  )
}
