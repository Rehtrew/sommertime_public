'use client'

import { useLinkStatus } from 'next/link'

/** Place inside a relatively positioned <Link>: dims it while its page is loading. */
export function LinkPending() {
  const { pending } = useLinkStatus()
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-[inherit] bg-white/50 transition-opacity duration-150 motion-safe:animate-pulse ${
        pending ? 'opacity-100 delay-75' : 'opacity-0'
      }`}
    />
  )
}
