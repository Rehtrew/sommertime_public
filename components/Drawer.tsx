'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/** A panel that slides in from the right on desktop and up from the bottom on phones. */
export function Drawer({ closeHref, label, children }: { closeHref: string; label: string; children: React.ReactNode }) {
  const router = useRouter()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(closeHref, { scroll: false })
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [closeHref, router])

  useEffect(() => {
    panel.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <Link href={closeHref} scroll={false} aria-label="Luk" className="drawer-backdrop absolute inset-0 bg-black/25" />
      <div
        ref={panel}
        tabIndex={-1}
        className="drawer-panel absolute inset-x-0 bottom-0 max-h-[92svh] overflow-y-auto overscroll-contain rounded-t-[32px] bg-bg px-3 pt-2 pb-[max(16px,env(safe-area-inset-bottom))] outline-none md:inset-y-3 md:right-3 md:left-auto md:max-h-none md:w-[460px] md:rounded-[32px] md:pt-3"
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-black/15 md:hidden" aria-hidden />
        {children}
      </div>
    </div>
  )
}
