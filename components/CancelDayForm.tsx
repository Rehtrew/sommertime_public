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
  const [reason, setReason] = useState<'sygdom' | 'egen'>('sygdom')
  const option = 'flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-tile px-4 text-[16px] has-[:checked]:bg-ink has-[:checked]:text-white'

  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[22px] text-danger">Aflys dagen</span>
          <span className="block text-[15px] text-muted">Fx hvis du er syg. Alle tider aflyses, og dagen lukkes for booking.</span>
        </span>
        <ChevronDown size={20} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <ActionForm action={action} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="back" value={back} />
        <div>
          <span className="label">Årsag</span>
          <div className="grid grid-cols-2 gap-2">
            <label className={option}>
              <input
                type="radio"
                name="reason"
                value="sygdom"
                className="sr-only"
                checked={reason === 'sygdom'}
                onChange={() => setReason('sygdom')}
              />
              Sygdom
            </label>
            <label className={option}>
              <input
                type="radio"
                name="reason"
                value="egen"
                className="sr-only"
                checked={reason === 'egen'}
                onChange={() => setReason('egen')}
              />
              Anden årsag
            </label>
          </div>
        </div>
        {reason === 'egen' && (
          <label className="block">
            <span className="label">Skriv årsagen til kunderne</span>
            <textarea
              name="custom"
              className="input !min-h-24"
              maxLength={300}
              required
              autoFocus
              placeholder="Fx: Salonen er desværre lukket pga. en vandskade."
            />
          </label>
        )}
        {count > 0 && (
          <label className="flex items-start gap-3 px-1">
            <input type="checkbox" name="notify" defaultChecked className="mt-0.5 h-6 w-6 shrink-0 accent-ink" />
            <span>
              Send mail til kunderne med årsagen og et forslag til en ny tid
              <span className="block text-[14px] text-muted">
                {emailCount === count
                  ? `${count} ${count === 1 ? 'kunde' : 'kunder'} får besked.`
                  : emailCount === 0
                    ? `${count === 1 ? 'Kunden har' : 'Kunderne har'} ingen e-mail, så du må selv give besked.`
                    : `${emailCount} af ${count} kunder har en e-mail. Resten må du selv give besked.`}
              </span>
            </span>
          </label>
        )}
        <ConfirmButton
          confirmText={
            count
              ? `${count} ${count === 1 ? 'tid' : 'tider'} bliver aflyst, og ${dayLabel} lukkes for booking.`
              : `${dayLabel} lukkes for booking.`
          }
          confirmLabel="Aflys dagen"
        >
          Aflys dagen
        </ConfirmButton>
      </ActionForm>
    </details>
  )
}
