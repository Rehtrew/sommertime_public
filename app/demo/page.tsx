import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { AuthShell } from '@/components/AuthShell'
import { DemoButtons } from '@/components/DemoButtons'
import { DEMO } from '@/lib/demo'

export const metadata: Metadata = { title: 'Demo' }

const MAILS = [
  ['welcome', 'Welcome'],
  ['customer-booked', 'Appointment booked'],
  ['reminder', 'Reminder the day before'],
  ['customer-moved', 'Appointment moved'],
  ['customer-cancelled', 'Appointment cancelled'],
  ['day-cancelled', 'Hairdresser is ill, with a suggested new time'],
  ['day-cancelled-custom', 'Day cancelled for another reason'],
  ['new', 'To the hairdresser: new booking'],
  ['cancelled', 'To the hairdresser: booking cancelled'],
]

export default function DemoPage() {
  if (!DEMO) notFound()
  return (
    <AuthShell compact>
      <h1 className="text-[52px] leading-[0.98] md:text-[80px]">Try the demo</h1>
      <p className="mt-4 max-w-md text-[19px] text-muted">
        A small booking system for a one-person hair salon. All names and appointments are made up, and everything resets
        regularly, so feel free to click around.
      </p>
      <div className="mt-8 max-w-md">
        <DemoButtons />
      </div>
      <div className="mt-10 max-w-md">
        <h2 className="text-[24px]">Emails</h2>
        <p className="mt-1 mb-3 text-[15px] text-muted">The demo doesn’t send emails, but you can see them here.</p>
        <ul className="flex flex-col gap-1.5">
          {MAILS.map(([type, label]) => (
            <li key={type}>
              <a
                href={`/api/mail-preview?type=${type}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-[18px] bg-card px-4 py-3 hover:bg-tile"
              >
                {label}
                <ArrowUpRight size={18} className="shrink-0 text-muted" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </AuthShell>
  )
}
