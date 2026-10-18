'use client'

import { createContext, startTransition, useActionState } from 'react'

export type FormState = { error?: string; ok?: string } | undefined

export const FormPendingContext = createContext(false)

/** A form bound to a server action that can return { error } or { ok } messages. */
export function ActionForm({
  action,
  children,
  className = '',
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  children: React.ReactNode
  className?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // Submit manually so React keeps the filled-in fields when the server returns an error.
        e.preventDefault()
        const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter)
        startTransition(() => formAction(data))
      }}
      className={className}
    >
      <FormPendingContext value={pending}>{children}</FormPendingContext>
      {state?.error && (
        <p role="alert" className="fade-in rounded-[18px] bg-danger-tile px-4 py-3 text-[16px] text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="fade-in rounded-[18px] bg-ok-tile px-4 py-3 text-[16px] text-ok">
          {state.ok}
        </p>
      )}
    </form>
  )
}
