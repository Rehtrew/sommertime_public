import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Check } from 'lucide-react'
import { ActionForm } from '@/components/ActionForm'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { requireCustomer } from '@/lib/auth'
import { freeSlots, getBooking, getServices, isUpcoming, categoriesInOrder } from '@/lib/data'
import { cap, categoryColor, priceRange } from '@/lib/format'
import { dayNumber, fmtDate, fmtDuration, fmtTime, fmtWeekdayShort } from '@/lib/time'
import { SALON } from '@/lib/salon'
import { book } from '@/app/actions/customer'
import { LinkPending } from '@/components/LinkPending'

export const metadata: Metadata = { title: 'Book en tid' }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function monthShort(date: string) {
  return new Intl.DateTimeFormat('da-DK', { month: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .replace('.', '')
}

export default async function BookPage(props: PageProps<'/book'>) {
  const me = await requireCustomer()
  const sp = await props.searchParams
  const services = await getServices()

  const moveId = Number(one(sp.flyt)) || 0
  let moving = moveId ? await getBooking(moveId) : undefined
  if (moving && (moving.customer_id !== me.id || moving.status !== 'booked' || !isUpcoming(moving))) moving = undefined

  const serviceParam = one(sp.service)
  const service = services.find((s) => s.id === Number(serviceParam ?? moving?.service_id))
  const categories = categoriesInOrder(services)
  const katParam = one(sp.kat)
  const cat = katParam && categories.includes(katParam) ? katParam : (service?.category ?? categories[0])

  const slots = service ? await freeSlots(service.duration_min, moving?.id) : null
  const dates = slots ? [...slots.keys()] : []
  const dateParam = one(sp.date)
  const date = dateParam && slots?.has(dateParam) ? dateParam : undefined
  const times = date ? slots!.get(date)! : []
  const timeParam = Number(one(sp.time))
  const time = date && times.includes(timeParam) ? timeParam : undefined

  const href = (p: { kat?: string; service?: number; date?: string; time?: number }, hash = '') => {
    const q = new URLSearchParams()
    if (moving) q.set('flyt', String(moving.id))
    for (const [k, v] of Object.entries(p)) if (v !== undefined) q.set(k, String(v))
    const s = q.toString()
    return `/book${s ? `?${s}` : ''}${hash}`
  }

  return (
    <>
      <div className="px-2 pt-4">
        <Link href="/hjem" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Tilbage">
          <ArrowLeft size={20} />
        </Link>
      </div>
      <h1 className="px-2 pt-5 pb-6 text-[48px] leading-none md:text-[72px]">{moving ? 'Flyt din tid' : 'Book en tid'}</h1>

      {sp.time && service && time === undefined && (
        <p className="mb-3 rounded-[28px] bg-danger-tile p-5 text-danger">
          Tiden er desværre blevet taget i mellemtiden. Vælg en anden tid herunder.
        </p>
      )}

      {moving && (
        <p className="mb-3 rounded-[28px] bg-card p-5 text-muted">
          Du flytter {moving.service_name.toLowerCase()}, {fmtDate(moving.date)} kl. {fmtTime(moving.start_min)}.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {/* 1. Service */}
        <section id="behandling" className="card scroll-mt-4">
          <Step n={1} title="Behandling" done={!!service} />
          {service ? (
            <div className="flex items-start justify-between gap-4 rounded-[20px] bg-tile p-4">
              <div>
                <p className="text-[19px] leading-snug">{service.name}</p>
                <p className="mt-1 text-[15px] text-muted">
                  {fmtDuration(service.duration_min)} · {priceRange(service.price_from, service.price_to)}
                </p>
              </div>
              <Link href={href({ kat: service.category })} scroll={false} className="chip !min-h-10 shrink-0 !bg-white">
                Skift
              </Link>
            </div>
          ) : (
            <>
              <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 md:-mx-7 md:px-7">
                {categories.map((c) => (
                  <Link key={c} href={href({ kat: c })} scroll={false} className="chip relative" aria-current={c === cat}>
                    {c}
                    <LinkPending />
                  </Link>
                ))}
              </div>
              <ul className="flex flex-col">
                {services
                  .filter((s) => s.category === cat)
                  .map((s) => (
                    <li key={s.id} className="border-t border-line first:border-0">
                      <Link href={href({ service: s.id }, '#dato')} className="group relative flex items-start gap-4 rounded-[16px] py-4">
                        <LinkPending />
                        <span
                          className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                          style={{ background: categoryColor(s.category) }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[19px] leading-snug">{s.name}</span>
                          {s.description && (
                            <span className="mt-1 line-clamp-2 text-[15px] leading-snug text-muted">{s.description}</span>
                          )}
                          <span className="mt-2 block text-[15px]">
                            {priceRange(s.price_from, s.price_to)} <span className="text-muted">· {fmtDuration(s.duration_min)}</span>
                          </span>
                        </span>
                        <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full border-[1.5px] border-[#c9c9c9] transition-colors group-hover:border-ink" />
                      </Link>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>

        {/* 2. Date */}
        {service && (
          <section id="dato" className="card fade-in scroll-mt-4">
            <Step n={2} title="Dato" done={!!date} />
            {dates.length === 0 ? (
              <p className="text-muted">
                Der er ingen ledige tider til {service.name.toLowerCase()} lige nu. Kig forbi igen lidt senere.
              </p>
            ) : (
              <div className="no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 md:-mx-7 md:px-7">
                {dates.map((d) => (
                  <Link
                    key={d}
                    href={href({ service: service.id, date: d }, '#tid')}
                    className={`relative flex w-[68px] shrink-0 snap-start flex-col items-center rounded-[22px] py-3 transition-colors ${
                      d === date ? 'bg-ink text-white' : 'bg-tile hover:bg-tile-strong'
                    }`}
                  >
                    <span className={`text-[14px] ${d === date ? 'text-white/70' : 'text-muted'}`}>{fmtWeekdayShort(d)}</span>
                    <span className="text-[28px] leading-tight">{dayNumber(d)}</span>
                    <span className={`text-[14px] ${d === date ? 'text-white/70' : 'text-muted'}`}>{monthShort(d)}</span>
                    <LinkPending />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. Time */}
        {service && date && (
          <section id="tid" className="card fade-in scroll-mt-4">
            <Step n={3} title="Tidspunkt" done={time !== undefined} />
            <p className="-mt-2 mb-4 text-muted">{cap(fmtDate(date))}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {times.map((t) => (
                <Link
                  key={t}
                  href={href({ service: service.id, date, time: t }, '#bekraeft')}
                  className="chip relative !px-0"
                  aria-current={t === time}
                >
                  {fmtTime(t)}
                  <LinkPending />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Confirm */}
        {service && date && time !== undefined && (
          <section id="bekraeft" className="card fade-in scroll-mt-4">
            <Step n={4} title="Bekræft" />
            <div className="rounded-[22px] bg-tile p-5">
              <p className="text-[26px] leading-tight">{service.name}</p>
              <p className="mt-2 text-[19px]">{cap(fmtDate(date))}</p>
              <p className="text-[19px]">
                kl. {fmtTime(time)}–{fmtTime(time + service.duration_min)}
              </p>
              <p className="mt-2 text-[15px] text-muted">{priceRange(service.price_from, service.price_to)} · {fmtDuration(service.duration_min)}</p>
              <p className="text-[15px] text-muted">{SALON.address}</p>
            </div>
            <ActionForm action={book} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="service" value={service.id} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="time" value={time} />
              {moving && <input type="hidden" name="move" value={moving.id} />}
              <Field label="Besked til frisøren (valgfrit)">
                <textarea
                  name="note"
                  className="input"
                  defaultValue={moving?.note ?? ''}
                  maxLength={500}
                  placeholder="Fx ønsker, hårlængde eller allergier"
                />
              </Field>
              <SubmitButton className="btn w-full" pendingText="Et øjeblik…">
                {moving ? 'Flyt min tid' : 'Bekræft booking'}
              </SubmitButton>
            </ActionForm>
          </section>
        )}
      </div>
    </>
  )
}

function Step({ n, title, done = false }: { n: number; title: string; done?: boolean }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-[24px] leading-tight">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] ${
          done ? 'bg-ink text-white' : 'bg-tile text-muted'
        }`}
      >
        {done ? <Check size={16} /> : n}
      </span>
      {title}
    </h2>
  )
}
