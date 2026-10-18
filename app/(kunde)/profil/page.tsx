import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, LogOut } from 'lucide-react'
import { ActionForm } from '@/components/ActionForm'
import { AvatarInput } from '@/components/AvatarInput'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { fmtPhone, requireCustomer } from '@/lib/auth'
import { firstName } from '@/lib/format'
import { changePassword, deleteProfile, logout, updateProfile } from '@/app/actions/customer'

export const metadata: Metadata = { title: 'Profil' }

export default async function ProfilePage(props: PageProps<'/profil'>) {
  const me = await requireCustomer()
  const { ny } = await props.searchParams

  return (
    <>
      <div className="px-2 pt-4">
        <Link href="/hjem" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Tilbage">
          <ArrowLeft size={20} />
        </Link>
      </div>
      <h1 className="px-2 pt-5 pb-6 text-[48px] leading-none md:text-[72px]">
        {ny ? `Velkommen, ${firstName(me.name)}` : 'Din profil'}
      </h1>

      {ny && (
        <Link href="/book" className="fade-in mb-3 flex items-center justify-between gap-4 rounded-[28px] bg-ink p-5 text-white">
          <span className="text-[19px] leading-snug">
            Din profil er klar. Tilføj gerne et billede, eller gå direkte til booking.
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink">
            <ArrowRight size={22} />
          </span>
        </Link>
      )}

      <div className="flex flex-col gap-3">
        <section className="card">
          <ActionForm action={updateProfile} className="flex flex-col gap-4">
            <AvatarInput name={me.name} initial={me.avatar} />
            <Field label="Navn" className="mt-2">
              <input className="input" name="name" defaultValue={me.name} autoComplete="name" required />
            </Field>
            <Field label="E-mail" hint="Du logger ind med den og får bekræftelser og påmindelser på mail.">
              <input className="input" name="email" type="email" defaultValue={me.email ?? ''} autoComplete="email" required />
            </Field>
            <Field label="Telefon (valgfrit)" hint="Så din frisør kan ringe, hvis der sker noget.">
              <input className="input" name="phone" type="tel" defaultValue={fmtPhone(me.phone)} autoComplete="tel" />
            </Field>
            <SubmitButton className="btn" pendingText="Gemmer…">
              Gem
            </SubmitButton>
          </ActionForm>
        </section>

        <section className="card">
          <h2 className="mb-4 text-[24px]">Skift adgangskode</h2>
          <ActionForm action={changePassword} className="flex flex-col gap-4">
            <Field label="Nuværende adgangskode">
              <input className="input" name="current" type="password" autoComplete="current-password" required />
            </Field>
            <Field label="Ny adgangskode">
              <input className="input" name="password" type="password" autoComplete="new-password" minLength={6} required />
            </Field>
            <SubmitButton className="btn btn-soft" pendingText="Gemmer…">
              Skift adgangskode
            </SubmitButton>
          </ActionForm>
        </section>

        <section className="card flex flex-col gap-3">
          <form action={logout}>
            <button className="btn btn-soft w-full">
              <LogOut size={18} /> Log ud
            </button>
          </form>
          <form action={deleteProfile}>
            <ConfirmButton
              confirmText="Din profil og dine kommende tider bliver slettet. Det kan ikke fortrydes."
              confirmLabel="Slet profil"
            >
              Slet min profil
            </ConfirmButton>
          </form>
        </section>
      </div>
    </>
  )
}
