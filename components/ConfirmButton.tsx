'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

/**
 * Destructive submit button that asks once before submitting.
 * Must be placed inside a <form>.
 */
export function ConfirmButton({
  children,
  confirmText = 'Er du sikker?',
  confirmLabel = 'Ja, fortsæt',
  className = 'btn btn-danger w-full',
}: {
  children: React.ReactNode
  confirmText?: string
  confirmLabel?: string
  className?: string
}) {
  const [asking, setAsking] = useState(false)
  const { pending } = useFormStatus()

  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {children}
      </button>
    )
  }
  return (
    <div className="fade-in rounded-[22px] bg-danger-tile p-4">
      <p className="mb-3 text-danger">{confirmText}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn btn-white btn-sm" onClick={() => setAsking(false)} disabled={pending}>
          Nej
        </button>
        <button type="submit" className="btn btn-sm !bg-danger" disabled={pending}>
          {pending ? 'Vent…' : confirmLabel}
        </button>
      </div>
    </div>
  )
}
