import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { AdminBookingForm } from '@/components/AdminBookingForm'
import { isDate } from '@/lib/time'

export const metadata: Metadata = { title: 'New booking' }

export default async function NewBookingPage(props: PageProps<'/admin/booking/new'>) {
  const sp = await props.searchParams
  const date = isDate(sp.date) ? sp.date : undefined
  const customerId = Number(sp.customer) || undefined
  return (
    <div className="mx-auto max-w-xl">
      <div className="px-2 pt-4">
        <Link
          href={date ? `/admin/calendar?date=${date}&day=1` : '/admin/calendar'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>
      <h1 className="px-2 pt-5 pb-6 text-[48px] leading-none md:text-[64px]">Book for customer</h1>
      <section className="card">
        <AdminBookingForm date={date} customerId={customerId} />
      </section>
      <p className="mt-4 px-3 text-[15px] text-muted">
        You can book outside your opening hours. The system only makes sure bookings don't overlap.
      </p>
    </div>
  )
}
