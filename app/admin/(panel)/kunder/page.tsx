import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { ActionForm } from '@/components/ActionForm'
import { Avatar } from '@/components/Avatar'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { query } from '@/lib/db'
import { fmtPhone } from '@/lib/auth'
import { fmtDateShort, nowCph } from '@/lib/time'
import { createCustomer } from '@/app/actions/admin'

export const metadata: Metadata = { title: 'Kunder' }

type Row = {
  id: number
  name: string
  email: string | null
  phone: string | null
  avatar: string | null
  visits: number
  next_date: string | null
}

export default async function CustomersPage(props: PageProps<'/admin/kunder'>) {
  const sp = await props.searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const now = nowCph()
  const rows = await query<Row>(
    `SELECT c.id, c.name, c.email, c.phone, c.avatar,
       (SELECT count(*)::int FROM bookings b WHERE b.customer_id = c.id AND b.status = 'booked'
          AND (b.date < $2 OR (b.date = $2 AND b.start_min <= $3))) AS visits,
       (SELECT min(b.date) FROM bookings b WHERE b.customer_id = c.id AND b.status = 'booked'
          AND (b.date > $2 OR (b.date = $2 AND b.start_min > $3))) AS next_date
     FROM customers c
     WHERE $1 = '' OR c.name ILIKE '%' || $1 || '%' OR c.email ILIKE '%' || $1 || '%' OR c.phone LIKE '%' || replace($1, ' ', '') || '%'
     ORDER BY lower(c.name)`,
    [q, now.date, now.min],
  )

  return (
    <>
      <div className="flex items-end justify-between gap-4 px-2 pt-4 pb-6 md:pt-2">
        <h1 className="text-[48px] leading-none md:text-[72px]">Kunder</h1>
        <span className="pb-1 text-[20px] text-muted">{rows.length}</span>
      </div>

      <details className="card group mb-3" open={sp.ny === '1'}>
        <summary className="flex cursor-pointer list-none items-center justify-between text-[20px] [&::-webkit-details-marker]:hidden">
          Opret kunde
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tile transition-transform group-open:rotate-45">
            <Plus size={20} />
          </span>
        </summary>
        <ActionForm action={createCustomer} className="mt-5 flex flex-col gap-4">
          <Field label="Navn">
            <input className="input" name="name" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail">
              <input className="input" name="email" type="email" />
            </Field>
            <Field label="Telefon">
              <input className="input" name="phone" type="tel" />
            </Field>
          </div>
          <Field label="Noter" hint="Kun synlige for dig. Fx farveopskrift eller ønsker.">
            <textarea className="input" name="notes" />
          </Field>
          <p className="ml-1 text-[14px] text-muted">
            Kunden kan senere selv oprette en profil med samme e-mail og overtager så sin historik.
          </p>
          <SubmitButton className="btn" pendingText="Opretter…">
            Opret kunde
          </SubmitButton>
        </ActionForm>
      </details>

      <form className="relative mb-3" role="search">
        <Search size={20} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-muted" />
        <input
          className="input !bg-card !pl-13"
          name="q"
          defaultValue={q}
          placeholder="Søg på navn, e-mail eller telefon"
          type="search"
        />
      </form>

      <section className="card !p-2 md:!p-3">
        {rows.length === 0 ? (
          <p className="p-4 text-muted">{q ? 'Ingen kunder matcher søgningen.' : 'Ingen kunder endnu.'}</p>
        ) : (
          <ul>
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/kunder/${c.id}`} className="flex items-center gap-4 rounded-[20px] p-3 hover:bg-tile">
                  <Avatar name={c.name} src={c.avatar} size={52} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[19px] leading-snug">{c.name}</span>
                    <span className="block truncate text-[15px] text-muted">
                      {[c.phone && fmtPhone(c.phone), c.email].filter(Boolean).join(' · ') || 'Ingen kontaktinfo'}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[15px] text-muted sm:block">
                    {c.visits} besøg
                    {c.next_date && <span className="block text-ink">Næste {fmtDateShort(c.next_date)}</span>}
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
