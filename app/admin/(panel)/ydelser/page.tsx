import type { Metadata } from 'next'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { ActionForm } from '@/components/ActionForm'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { getServices, categoriesInOrder, type Service } from '@/lib/data'
import { categoryColor, priceRange } from '@/lib/format'
import { fmtDuration } from '@/lib/time'
import { createService, deleteService, moveCategory, moveService, updateService } from '@/app/actions/admin'

export const metadata: Metadata = { title: 'Ydelser' }

export default async function ServicesPage() {
  const services = await getServices(true)
  const categories = categoriesInOrder(services)

  return (
    <>
      <div className="px-2 pt-4 pb-6 md:pt-2">
        <h1 className="text-[48px] leading-none md:text-[72px]">Ydelser</h1>
        <p className="mt-3 text-muted">
          Det kunderne kan vælge imellem, når de booker. Kategorien øverst vises først, når de booker.
        </p>
      </div>

      <details className="card group mb-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[20px] [&::-webkit-details-marker]:hidden">
          Ny ydelse
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tile transition-transform group-open:rotate-45">
            <Plus size={20} />
          </span>
        </summary>
        <ActionForm action={createService} className="mt-5 flex flex-col gap-4">
          <ServiceFields categories={categories} />
          <SubmitButton className="btn" pendingText="Gemmer…">
            Opret ydelse
          </SubmitButton>
        </ActionForm>
      </details>

      <datalist id="categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="flex flex-col gap-3">
        {categories.map((cat, ci) => {
          const list = services.filter((s) => s.category === cat)
          return (
            <section key={cat} className="card !p-2 md:!p-3">
              <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
                <h2 className="flex items-center gap-3 text-[26px]">
                  <span className="h-3 w-3 rounded-full" style={{ background: categoryColor(cat) }} />
                  {cat}
                </h2>
                <div className="flex gap-1.5">
                  {(['up', 'down'] as const).map((dir) => (
                    <form key={dir} action={moveCategory}>
                      <input type="hidden" name="category" value={cat} />
                      <input type="hidden" name="dir" value={dir} />
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-tile hover:bg-tile-strong disabled:opacity-30"
                        disabled={dir === 'up' ? ci === 0 : ci === categories.length - 1}
                        aria-label={dir === 'up' ? `Flyt ${cat} op` : `Flyt ${cat} ned`}
                      >
                        {dir === 'up' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
              <ul>
                {list.map((s, i) => (
                  <li key={s.id}>
                    <details className="group/item rounded-[20px] open:bg-tile">
                      <summary className="flex cursor-pointer list-none items-center gap-4 rounded-[20px] p-3 hover:bg-tile [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[18px] leading-snug ${s.active ? '' : 'text-muted'}`}>
                            {s.name}
                            {!s.active && <span className="ml-2 rounded-full bg-tile-strong px-2 py-0.5 text-[13px]">skjult</span>}
                          </span>
                          <span className="block text-[15px] text-muted">
                            {fmtDuration(s.duration_min)} · {priceRange(s.price_from, s.price_to)}
                          </span>
                        </span>
                        <ChevronDown size={20} className="shrink-0 text-muted transition-transform group-open/item:rotate-180" />
                      </summary>
                      <div className="px-3 pb-4">
                        <ActionForm action={updateService} className="flex flex-col gap-4">
                          <input type="hidden" name="id" value={s.id} />
                          <ServiceFields service={s} categories={categories} white />
                          <SubmitButton className="btn" pendingText="Gemmer…">
                            Gem
                          </SubmitButton>
                        </ActionForm>
                        <div className="mt-3 flex gap-2">
                          <form action={moveService}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="dir" value="up" />
                            <button className="btn btn-white btn-sm" disabled={i === 0} aria-label="Flyt op">
                              <ChevronUp size={18} /> Op
                            </button>
                          </form>
                          <form action={moveService}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="dir" value="down" />
                            <button className="btn btn-white btn-sm" disabled={i === list.length - 1} aria-label="Flyt ned">
                              <ChevronDown size={18} /> Ned
                            </button>
                          </form>
                        </div>
                        <form action={deleteService} className="mt-3">
                          <input type="hidden" name="id" value={s.id} />
                          <ConfirmButton
                            confirmText="Ydelsen slettes. Eksisterende bookinger beholdes. Vil du hellere skjule den, så fjern fluebenet ved “Kan bookes af kunder”."
                            confirmLabel="Slet"
                          >
                            Slet ydelse
                          </ConfirmButton>
                        </form>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}

function ServiceFields({ service, categories, white }: { service?: Service; categories: string[]; white?: boolean }) {
  const cls = `input ${white ? '!bg-white' : ''}`
  return (
    <>
      <Field label="Navn">
        <input className={cls} name="name" defaultValue={service?.name} required />
      </Field>
      <Field label="Kategori" hint={`Fx ${categories.slice(0, 3).join(', ')}`}>
        <input className={cls} name="category" list="categories" defaultValue={service?.category} required />
      </Field>
      <Field label="Beskrivelse">
        <textarea className={cls} name="description" defaultValue={service?.description} />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Minutter">
          <input
            className={cls}
            name="duration"
            type="number"
            min={5}
            max={600}
            step={5}
            inputMode="numeric"
            defaultValue={service?.duration_min ?? 60}
            required
          />
        </Field>
        <Field label="Pris fra">
          <input className={cls} name="price_from" type="number" min={0} inputMode="numeric" defaultValue={service?.price_from} required />
        </Field>
        <Field label="Pris til">
          <input className={cls} name="price_to" type="number" min={0} inputMode="numeric" defaultValue={service?.price_to ?? ''} />
        </Field>
      </div>
      {service && (
        <label className="flex items-center gap-3 px-1">
          <input type="checkbox" name="active" defaultChecked={service.active} className="h-6 w-6 accent-ink" />
          Kan bookes af kunder
        </label>
      )}
    </>
  )
}
