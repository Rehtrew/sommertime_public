import Link from 'next/link'
import { DEMO } from '@/lib/demo'
import { demoAsAdmin, demoAsCustomer } from '@/app/actions/demo'

/** A thin bar on every page while the app runs as a demo, with the ways in. */
export function DemoBar() {
  if (!DEMO) return null
  const link = 'underline underline-offset-2 hover:opacity-70'
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink px-4 py-2 text-center text-small leading-snug text-white">
      <span className="text-white/60">Demo with made-up data that resets regularly</span>
      <form action={demoAsCustomer}>
        <button className={link}>View as customer</button>
      </form>
      <form action={demoAsAdmin}>
        <button className={link}>View as hairdresser</button>
      </form>
      <Link href="/demo" className={link}>
        Emails
      </Link>
    </div>
  )
}
