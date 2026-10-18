import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { AdminBookingForm } from '@/components/AdminBookingForm'
import { isDate } from '@/lib/time'

export const metadata: Metadata = { title: 'Ny booking' }

export default async function NewBookingPage(props: PageProps<'/admin/booking/ny'>) {
  const sp = await props.searchParams
  const date = isDate(sp.date) ? sp.date : undefined
  const customerId = Number(sp.kunde) || undefined
  return (
    <div className="mx-auto max-w-xl">
      <div className="px-2 pt-4">
        <Link
          href={date ? `/admin/kalender?date=${date}&dag=1` : '/admin/kalender'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card"
          aria-label="Tilbage"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>
      <h1 className="px-2 pt-5 pb-6 text-[48px] leading-none md:text-[64px]">Book for kunde</h1>
      <section className="card">
        <AdminBookingForm date={date} customerId={customerId} />
      </section>
      <p className="mt-4 px-3 text-[15px] text-muted">
        Du kan booke uden for dine åbningstider. Systemet sørger kun for, at bookinger ikke overlapper.
      </p>
    </div>
  )
}
