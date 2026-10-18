import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { AuthShell } from '@/components/AuthShell'
import { DemoButtons } from '@/components/DemoButtons'
import { DEMO } from '@/lib/demo'

export const metadata: Metadata = { title: 'Demo' }

const MAILS = [
  ['velkommen', 'Velkommen'],
  ['kunde-booket', 'Din tid er booket'],
  ['reminder', 'Påmindelse dagen før'],
  ['kunde-flyttet', 'Din tid er flyttet'],
  ['kunde-aflyst', 'Din tid er aflyst'],
  ['dag-aflyst', 'Frisøren er syg, med forslag til ny tid'],
  ['ny', 'Til frisøren: ny booking'],
  ['aflyst', 'Til frisøren: booking aflyst'],
]

export default function DemoPage() {
  if (!DEMO) notFound()
  return (
    <AuthShell compact>
      <h1 className="text-[52px] leading-[0.98] md:text-[80px]">Prøv demoen</h1>
      <p className="mt-4 max-w-md text-[19px] text-muted">
        Et lille bookingsystem til en frisør med faste kunder. Alle navne og tider er opdigtede, og alt nulstilles jævnligt, så
        du må gerne trykke på det hele.
      </p>
      <p className="mt-2 max-w-md text-[15px] text-muted">
        A small booking system for a one-person hair salon. The interface is in Danish. All data is made up and resets
        regularly.
      </p>
      <div className="mt-8 max-w-md">
        <DemoButtons />
      </div>
      <div className="mt-10 max-w-md">
        <h2 className="text-[24px]">E-mails</h2>
        <p className="mt-1 mb-3 text-[15px] text-muted">Demoen sender ikke mails, men her kan du se dem.</p>
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
