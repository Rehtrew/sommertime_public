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
          href={`/admin/kalender?date=${b.date}&dag=1`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card"
          aria-label="Tilbage"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>
      <div className="px-2 pt-5 pb-6">
        <p className="text-[20px] text-muted">
          {cap(fmtDate(b.date))} kl. {fmtTime(b.start_min)}
        </p>
        <h1 className="text-[44px] leading-none md:text-[60px]">
          {b.customer_id ? (
            <Link href={`/admin/kunder/${b.customer_id}`} className="hover:underline">
              {b.customer_name}
            </Link>
          ) : (
            'Slettet kunde'
          )}
        </h1>
      </div>

      {b.status === 'cancelled' && (
        <p className="mb-3 rounded-[24px] bg-danger-tile p-5 text-danger">
          {b.cancelled_by === 'salon'
            ? `Du har aflyst denne tid${b.cancel_reason ? ` (${b.cancel_reason})` : ''}.`
            : 'Kunden har aflyst denne tid.'}{' '}
          Gem for at genaktivere den.
        </p>
      )}

      <section className="card">
        <AdminBookingForm booking={b} />
      </section>

      <section className="card mt-3 flex flex-col gap-3">
        {b.status === 'booked' && (
          <a href={`/api/kalender/${b.id}`} className="btn btn-soft">
            <CalendarPlus size={18} /> Føj til min kalender
          </a>
        )}
        <form action={deleteBooking} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={b.id} />
          {b.status === 'booked' && isUpcoming(b) && (
            <label className="flex items-start gap-3 px-1">
              <input type="checkbox" name="notify" defaultChecked className="mt-0.5 h-6 w-6 shrink-0 accent-ink" />
              <span>
                Giv kunden besked på mail, hvis jeg sletter tiden
                <span className="block text-[14px] text-muted">Kun hvis kunden har en e-mail.</span>
              </span>
            </label>
          )}
          <ConfirmButton confirmText="Bookingen slettes helt." confirmLabel="Slet">
            Slet booking
          </ConfirmButton>
        </form>
      </section>
    </div>
  )
}
