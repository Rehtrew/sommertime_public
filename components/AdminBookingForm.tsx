import { ActionForm } from './ActionForm'
import { Field } from './Field'
import { SubmitButton } from './SubmitButton'
import { saveBooking } from '@/app/actions/admin'
import { query } from '@/lib/db'
import { getServices, categoriesInOrder, type Booking } from '@/lib/data'
import { fmtDuration, fmtTime } from '@/lib/time'

export async function AdminBookingForm({
  booking,
  date,
  customerId,
}: {
  booking?: Booking
  date?: string
  customerId?: number
}) {
  const [customers, services] = await Promise.all([
    query<{ id: number; name: string }>('SELECT id, name FROM customers ORDER BY lower(name)'),
    getServices(true),
  ])
  const categories = categoriesInOrder(services)
  const current = services.find((s) => s.id === booking?.service_id)
  const duration = booking ? booking.end_min - booking.start_min : undefined
  const customDuration = booking && current && duration !== current.duration_min ? duration : undefined

  return (
    <ActionForm action={saveBooking} className="flex flex-col gap-4">
      {booking && <input type="hidden" name="id" value={booking.id} />}
      <Field label="Customer">
        <select name="customer" className="input" defaultValue={booking?.customer_id ?? customerId ?? ''} required>
          <option value="" disabled>
            Choose customer
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Treatment">
        <select name="service" className="input" defaultValue={booking?.service_id ?? ''} required>
          <option value="" disabled>
            Choose treatment
          </option>
          {categories.map((cat) => (
            <optgroup key={cat} label={cat}>
              {services
                .filter((s) => s.category === cat)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {fmtDuration(s.duration_min)}
                    {s.active ? '' : ' (hidden)'}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Date">
          <input className="input" type="date" name="date" defaultValue={booking?.date ?? date} required />
        </Field>
        <Field label="Time">
          <input
            className="input"
            type="time"
            name="time"
            step={900}
            defaultValue={booking ? fmtTime(booking.start_min) : undefined}
            required
          />
        </Field>
      </div>
      <Field label="Duration in minutes (optional)" hint="Leave empty to use the treatment's duration.">
        <input
          className="input"
          type="number"
          name="duration"
          min={5}
          max={600}
          step={5}
          inputMode="numeric"
          defaultValue={customDuration}
        />
      </Field>
      <Field label="Note">
        <textarea name="note" className="input" defaultValue={booking?.note ?? ''} maxLength={500} />
      </Field>
      <label className="flex items-start gap-3 px-1">
        <input type="checkbox" name="notify" defaultChecked className="mt-0.5 h-6 w-6 shrink-0 accent-ink" />
        <span>
          {booking ? 'Email the customer if the appointment changes' : 'Email a confirmation to the customer'}
          <span className="block text-[14px] text-muted">Only if the customer has an email.</span>
        </span>
      </label>
      <SubmitButton className="btn" pendingText="Saving…">
        {booking ? 'Save changes' : 'Book appointment'}
      </SubmitButton>
    </ActionForm>
  )
}
