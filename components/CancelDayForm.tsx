'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ActionForm, type FormState } from './ActionForm'
import { ConfirmButton } from './ConfirmButton'

/** Cancels every booking on a day and closes it, e.g. when the hairdresser is ill. */
export function CancelDayForm({
  action,
  date,
  back,
  count,
  emailCount,
  dayLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  date: string
  back: string
  count: number
  emailCount: number
  dayLabel: string
}) {
  const [reason, setReason] = useState<'illness' | 'custom'>('illness')
  const option = 'flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-tile px-4 text-[16px] has-[:checked]:bg-ink has-[:checked]:text-white'

  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[22px] text-danger">Cancel the day</span>
          <span className="block text-[15px] text-muted">E.g. if you're ill. All appointments are cancelled and the day is closed for booking.</span>
        </span>
        <ChevronDown size={20} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <ActionForm action={action} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="back" value={back} />
        <div>
          <span className="label">Reason</span>
          <div className="grid grid-cols-2 gap-2">
            <label className={option}>
              <input
                type="radio"
                name="reason"
                value="illness"
                className="sr-only"
                checked={reason === 'illness'}
                onChange={() => setReason('illness')}
              />
              Illness
            </label>
            <label className={option}>
              <input
                type="radio"
                name="reason"
                value="custom"
                className="sr-only"
                checked={reason === 'custom'}
                onChange={() => setReason('custom')}
              />
              Other reason
            </label>
          </div>
        </div>
        {reason === 'custom' && (
          <label className="block">
            <span className="label">Write the reason for the customers</span>
            <textarea
              name="custom"
              className="input !min-h-24"
              maxLength={300}
              required
              autoFocus
              placeholder="E.g.: Sorry, the salon is closed due to water damage."
            />
          </label>
        )}
        {count > 0 && (
          <label className="flex items-start gap-3 px-1">
            <input type="checkbox" name="notify" defaultChecked className="mt-0.5 h-6 w-6 shrink-0 accent-ink" />
            <span>
              Email the customers the reason and a suggested new time
              <span className="block text-[14px] text-muted">
                {emailCount === count
                  ? `${count} ${count === 1 ? 'customer' : 'customers'} will be notified.`
                  : emailCount === 0
                    ? `${count === 1 ? 'The customer has' : 'The customers have'} no email, so you'll need to tell them yourself.`
                    : `${emailCount} of ${count} customers ${emailCount === 1 ? 'has' : 'have'} an email. You'll need to tell the rest yourself.`}
              </span>
            </span>
          </label>
        )}
        <ConfirmButton
          confirmText={
            count
              ? `${count} ${count === 1 ? 'appointment' : 'appointments'} will be cancelled, and ${dayLabel} will be closed for booking.`
              : `${dayLabel} will be closed for booking.`
          }
          confirmLabel="Cancel the day"
        >
          Cancel the day
        </ConfirmButton>
      </ActionForm>
    </details>
  )
}
