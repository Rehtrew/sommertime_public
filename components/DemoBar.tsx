import Link from 'next/link'
import { DEMO } from '@/lib/demo'

/** A thin bar on every page while the app runs as a demo. */
export function DemoBar() {
  if (!DEMO) return null
  return (
    <div className="bg-ink px-4 py-2 text-center text-[13px] leading-snug text-white">
      Demo med opdigtede data, der nulstilles jævnligt ·{' '}
      <Link href="/demo" className="underline underline-offset-2">
        Skift mellem kunde og frisør
      </Link>
    </div>
  )
}
