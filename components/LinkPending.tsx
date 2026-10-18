'use client'

import { useLinkStatus } from 'next/link'

/** Place inside a relatively positioned <Link>: dims it while its page is loading. */
export function LinkPending() {
  const { pending } = useLinkStatus()
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-[inherit] bg-white/50 transition-opacity duration-150 ${
        // Only pulse while loading: the pulse animation would otherwise override opacity-0 and grey out the link.
        pending ? 'opacity-100 delay-75 motion-safe:animate-pulse' : 'opacity-0'
      }`}
    />
  )
}
