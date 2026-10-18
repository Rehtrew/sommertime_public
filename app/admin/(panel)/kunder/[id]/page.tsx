import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, MessageCircle, Phone, Plus } from 'lucide-react'
import { ActionForm } from '@/components/ActionForm'
import { AdminBookingRow } from '@/components/AdminBookingRow'
import { Avatar } from '@/components/Avatar'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { query, one } from '@/lib/db'
import { fmtPhone } from '@/lib/auth'
import { isUpcoming, type Booking, type Customer } from '@/lib/data'
import { kr } from '@/lib/format'
import { fmtDateShort, relativeDay } from '@/lib/time'
import { deleteCustomer, saveNotes, setCustomerPassword, updateCustomer } from '@/app/actions/admin'

export const metadata: Metadata = { title: 'Kunde' }

export default async function CustomerPage(props: PageProps<'/admin/kunder/[id]'>) {
  const { id } = await props.params
  const c = await one<Customer>('SELECT * FROM customers WHERE id = $1', [Number(id)])
  if (!c) notFound()
  const bookings = await query<Booking>(
    `SELECT b.*, $2::text AS customer_name FROM bookings b WHERE b.customer_id = $1 ORDER BY b.date DESC, b.start_min DESC`,
    [c.id, c.name],
  )
  const active = bookings.filter((b) => b.status === 'booked')
  const upcoming = active.filter(isUpcoming).reverse()
  const past = active.filter((b) => !isUpcoming(b))
  const cancelled = bookings.filter((b) => b.status === 'cancelled')
  const spent = past.reduce((sum, b) => sum + b.price_from, 0)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="px-2 pt-4">
        <Link href="/admin/kunder" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Tilbage">
          <ArrowLeft size={20} />
        </Link>
      </div>

      <div className="flex items-center gap-5 px-2 pt-5 pb-6">
        <Avatar name={c.name} src={c.avatar} size={84} />
        <div className="min-w-0">
          <h1 className="text-[40px] leading-none break-words md:text-[60px]">{c.name}</h1>
          <p className="mt-2 text-[15px] text-muted">
            {c.password_hash ? 'Har profil' : 'Ingen profil endnu'} · kunde siden {fmtDateShort(new Date(c.created_at).toISOString().slice(0, 10))}
          </p>
        </div>
      </div>

      {(c.phone || c.email) && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {c.phone && (
            <a href={`tel:${c.phone}`} className="action-tile !bg-card">
              <Phone size={22} strokeWidth={1.8} /> Ring
            </a>
          )}
          {c.phone && (
            <a href={`sms:${c.phone}`} className="action-tile !bg-card">
              <MessageCircle size={22} strokeWidth={1.8} /> SMS
            </a>
          )}
          {c.email && (
            <a href={`mailto:${c.email}`} className="action-tile !bg-card">
              <Mail size={22} strokeWidth={1.8} /> Mail
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Besøg" value={String(past.length)} />
        <Stat label="Sidste besøg" value={past[0] ? fmtDateShort(past[0].date) : '–'} small />
        <Stat label="Forbrug ca." value={kr(spent)} small />
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <section className="card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[26px]">Kommende</h2>
            <Link href={`/admin/booking/ny?kunde=${c.id}`} className="btn btn-sm">
              <Plus size={18} /> Book
            </Link>
          </div>
          {upcoming.length ? (
            <div className="flex flex-col gap-2">
              {upcoming.map((b) => (
                <AdminBookingRow key={b.id} b={b} hideCustomer showDate={`${relativeDay(b.date)}, ${fmtDateShort(b.date)}`} />
              ))}
            </div>
          ) : (
            <p className="text-muted">Ingen kommende tider.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-1 text-[26px]">Noter</h2>
          <p className="mb-4 text-[15px] text-muted">Kun synlige for dig.</p>
          <ActionForm action={saveNotes} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={c.id} />
            <textarea
              name="notes"
              className="input !min-h-36"
              defaultValue={c.notes}
              placeholder="Fx farveopskrift, hårtype, allergier eller ønsker"
            />
            <SubmitButton className="btn btn-soft" pendingText="Gemmer…">
              Gem noter
            </SubmitButton>
          </ActionForm>
        </section>

        {(past.length > 0 || cancelled.length > 0) && (
          <section className="card">
            <h2 className="mb-3 text-[26px]">Historik</h2>
            <ul>
              {[...past, ...cancelled]
                .sort((a, b) => b.date.localeCompare(a.date) || b.start_min - a.start_min)
                .map((b) => (
                  <li key={b.id} className="border-t border-line first:border-0">
                    <Link href={`/admin/booking/${b.id}`} className="flex items-baseline justify-between gap-4 py-3">
                      <span className={b.status === 'cancelled' ? 'text-muted line-through decoration-1' : ''}>
                        {b.service_name}
                      </span>
                      <span className="shrink-0 text-[15px] text-muted">
                        {b.status === 'cancelled' ? 'Aflyst · ' : ''}
                        {fmtDateShort(b.date)}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section className="card">
          <h2 className="mb-4 text-[26px]">Oplysninger</h2>
          <ActionForm action={updateCustomer} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={c.id} />
            <Field label="Navn">
              <input className="input" name="name" defaultValue={c.name} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail">
                <input className="input" name="email" type="email" defaultValue={c.email ?? ''} />
              </Field>
              <Field label="Telefon">
                <input className="input" name="phone" type="tel" defaultValue={fmtPhone(c.phone)} />
              </Field>
            </div>
            <SubmitButton className="btn btn-soft" pendingText="Gemmer…">
              Gem oplysninger
            </SubmitButton>
          </ActionForm>
        </section>

        <section className="card">
          <h2 className="mb-1 text-[26px]">Adgangskode</h2>
          <p className="mb-4 text-[15px] text-muted">
            {c.password_hash
              ? 'Har kunden glemt sin adgangskode, kan du sætte en ny her og give den videre.'
              : 'Kunden har ikke oprettet en profil endnu. Du kan sætte en adgangskode for dem her.'}
          </p>
          <ActionForm action={setCustomerPassword} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={c.id} />
            <input className="input" name="password" type="text" minLength={6} placeholder="Ny adgangskode" autoComplete="off" required />
            <SubmitButton className="btn btn-soft" pendingText="Gemmer…">
              Sæt adgangskode
            </SubmitButton>
          </ActionForm>
        </section>

        <form action={deleteCustomer} className="px-1">
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton
            confirmText={`${c.name} og alle kommende tider slettes. Tidligere besøg bliver anonyme i statistikken.`}
            confirmLabel="Slet kunde"
          >
            Slet kunde
          </ConfirmButton>
        </form>
      </div>
    </div>
  )
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-[24px] bg-card p-4 md:p-5">
      <span className="block text-[14px] text-muted">{label}</span>
      <span className={`mt-1 block leading-tight ${small ? 'text-[19px] md:text-[24px]' : 'text-[36px] md:text-[44px]'}`}>
        {value}
      </span>
    </div>
  )
}
