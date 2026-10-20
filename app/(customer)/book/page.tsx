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

export const metadata: Metadata = { title: 'Book an appointment' }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function monthShort(date: string) {
  return new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .replace('.', '')
}

export default async function BookPage(props: PageProps<'/book'>) {
  const me = await requireCustomer()
  const sp = await props.searchParams
  const services = await getServices()

  const moveId = Number(one(sp.move)) || 0
  let moving = moveId ? await getBooking(moveId) : undefined
  if (moving && (moving.customer_id !== me.id || moving.status !== 'booked' || !isUpcoming(moving))) moving = undefined

  const serviceParam = one(sp.service)
  const service = services.find((s) => s.id === Number(serviceParam ?? moving?.service_id))
  const categories = categoriesInOrder(services)
  const catParam = one(sp.cat)
  const cat = catParam && categories.includes(catParam) ? catParam : (service?.category ?? categories[0])

  const slots = service ? await freeSlots(service.duration_min, moving?.id) : null
  const dates = slots ? [...slots.keys()] : []
  const dateParam = one(sp.date)
  const date = dateParam && slots?.has(dateParam) ? dateParam : undefined
  const times = date ? slots!.get(date)! : []
  const timeParam = Number(one(sp.time))
  const time = date && times.includes(timeParam) ? timeParam : undefined

  const href = (p: { cat?: string; service?: number; date?: string; time?: number }, hash = '') => {
    const q = new URLSearchParams()
    if (moving) q.set('move', String(moving.id))
    for (const [k, v] of Object.entries(p)) if (v !== undefined) q.set(k, String(v))
    const s = q.toString()
    return `/book${s ? `?${s}` : ''}${hash}`
  }

  return (
    <>
      <div className="px-2 pt-4">
        <Link href="/home" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
      </div>
      <h1 className="px-2 pt-5 pb-6 text-display">{moving ? 'Reschedule' : 'Book an appointment'}</h1>

      {sp.time && service && time === undefined && (
        <p className="mb-3 rounded-[28px] bg-danger-tile p-5 text-danger">
          Sorry, that time was taken in the meantime. Pick another time below.
        </p>
      )}

      {moving && (
        <p className="mb-3 rounded-[28px] bg-card p-5 text-muted">
          You're rescheduling {moving.service_name.toLowerCase()}, {fmtDate(moving.date)} at {fmtTime(moving.start_min)}.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {/* 1. Service */}
        <section id="service" className="card scroll-mt-4">
          <Step n={1} title="Treatment" done={!!service} />
          {service ? (
            <div className="flex items-start justify-between gap-4 rounded-[20px] bg-tile p-4">
              <div>
                <p className="text-body leading-snug">{service.name}</p>
                <p className="mt-1 text-small text-muted">
                  {fmtDuration(service.duration_min)} · {priceRange(service.price_from, service.price_to)}
                </p>
              </div>
              <Link href={href({ cat: service.category })} scroll={false} className="chip !min-h-10 shrink-0 !bg-white">
                Change
              </Link>
            </div>
          ) : (
            <>
              <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 md:-mx-7 md:px-7">
                {categories.map((c) => (
                  <Link key={c} href={href({ cat: c })} scroll={false} className="chip relative" aria-current={c === cat}>
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
                      <Link href={href({ service: s.id }, '#date')} className="group relative flex items-start gap-4 rounded-[16px] py-4">
                        <LinkPending />
                        <span
                          className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                          style={{ background: categoryColor(s.category) }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-body leading-snug">{s.name}</span>
                          {s.description && (
                            <span className="mt-1 line-clamp-2 text-small leading-snug text-muted">{s.description}</span>
                          )}
                          <span className="mt-2 block text-small">
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
          <section id="date" className="card fade-in scroll-mt-4">
            <Step n={2} title="Date" done={!!date} />
            {dates.length === 0 ? (
              <p className="text-muted">
                No free times for {service.name.toLowerCase()} right now. Check back a little later.
              </p>
            ) : (
              <div className="no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 md:-mx-7 md:px-7">
                {dates.map((d) => (
                  <Link
                    key={d}
                    href={href({ service: service.id, date: d }, '#time')}
                    className={`relative flex w-[68px] shrink-0 snap-start flex-col items-center rounded-[22px] py-3 transition-colors ${
                      d === date ? 'bg-ink text-white' : 'bg-tile hover:bg-tile-strong'
                    }`}
                  >
                    <span className={`text-small ${d === date ? 'text-white/70' : 'text-muted'}`}>{fmtWeekdayShort(d)}</span>
                    <span className="text-title leading-tight">{dayNumber(d)}</span>
                    <span className={`text-small ${d === date ? 'text-white/70' : 'text-muted'}`}>{monthShort(d)}</span>
                    <LinkPending />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. Time */}
        {service && date && (
          <section id="time" className="card fade-in scroll-mt-4">
            <Step n={3} title="Time" done={time !== undefined} />
            <p className="-mt-2 mb-4 text-muted">{cap(fmtDate(date))}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {times.map((t) => (
                <Link
                  key={t}
                  href={href({ service: service.id, date, time: t }, '#confirm')}
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
          <section id="confirm" className="card fade-in scroll-mt-4">
            <Step n={4} title="Confirm" />
            <div className="rounded-[22px] bg-tile p-5">
              <p className="text-title leading-tight">{service.name}</p>
              <p className="mt-2 text-body">{cap(fmtDate(date))}</p>
              <p className="text-body">
                {fmtTime(time)}–{fmtTime(time + service.duration_min)}
              </p>
              <p className="mt-2 text-small text-muted">{priceRange(service.price_from, service.price_to)} · {fmtDuration(service.duration_min)}</p>
              <p className="text-small text-muted">{SALON.address}</p>
            </div>
            <ActionForm action={book} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="service" value={service.id} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="time" value={time} />
              {moving && <input type="hidden" name="move" value={moving.id} />}
              <Field label="Message for your hairdresser (optional)">
                <textarea
                  name="note"
                  className="input"
                  defaultValue={moving?.note ?? ''}
                  maxLength={500}
                  placeholder="E.g. wishes, hair length or allergies"
                />
              </Field>
              <SubmitButton className="btn w-full" pendingText="One moment…">
                {moving ? 'Reschedule appointment' : 'Confirm booking'}
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
    <h2 className="mb-4 flex items-center gap-3 text-title leading-tight">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-small ${
          done ? 'bg-ink text-white' : 'bg-tile text-muted'
        }`}
      >
        {done ? <Check size={16} /> : n}
      </span>
      {title}
    </h2>
  )
}
