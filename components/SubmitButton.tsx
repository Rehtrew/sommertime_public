'use client'

import { useContext } from 'react'
import { useFormStatus } from 'react-dom'
import { FormPendingContext } from './ActionForm'

export function SubmitButton({
  children,
  className = 'btn',
  pendingText,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const status = useFormStatus()
  const actionPending = useContext(FormPendingContext)
  const pending = status.pending || actionPending
  return (
    <button type="submit" className={className} disabled={pending || rest.disabled} {...rest}>
      {pending && pendingText ? pendingText : children}
    </button>
  )
}
