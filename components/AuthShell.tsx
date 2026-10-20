import Link from 'next/link'
import { FlowVideo } from './FlowVideo'
import { SALON } from '@/lib/salon'

export function AuthShell({
  children,
  compact = false,
}: {
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <main className="mx-auto flex min-h-svh max-w-[1400px] flex-col gap-3 p-3 md:grid md:grid-cols-2 md:p-4">
      <section
        className={`relative overflow-hidden rounded-[32px] bg-lilac md:sticky md:top-4 md:h-[calc(100svh-2rem)] ${
          compact ? 'h-[26svh] min-h-44' : 'h-[50svh] min-h-80'
        }`}
      >
        <FlowVideo className="absolute inset-0" />
        <Link href="/" className="absolute top-5 left-6 text-title md:top-8 md:left-9">
          {SALON.name}
        </Link>
      </section>
      <section className="flex flex-1 flex-col justify-end px-2 pt-6 pb-6 md:justify-center md:px-12 md:py-12 lg:px-20">
        {children}
      </section>
    </main>
  )
}
