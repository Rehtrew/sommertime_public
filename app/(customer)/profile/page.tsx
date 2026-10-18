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

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage(props: PageProps<'/profile'>) {
  const me = await requireCustomer()
  const { new: isNew } = await props.searchParams

  return (
    <>
      <div className="px-2 pt-4">
        <Link href="/home" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
      </div>
      <h1 className="px-2 pt-5 pb-6 text-[48px] leading-none md:text-[72px]">
        {isNew ? `Welcome, ${firstName(me.name)}` : 'Your profile'}
      </h1>

      {isNew && (
        <Link href="/book" className="fade-in mb-3 flex items-center justify-between gap-4 rounded-[28px] bg-ink p-5 text-white">
          <span className="text-[19px] leading-snug">
            Your profile is ready. Add a photo if you like, or go straight to booking.
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
            <Field label="Name" className="mt-2">
              <input className="input" name="name" defaultValue={me.name} autoComplete="name" required />
            </Field>
            <Field label="Email" hint="You log in with it and get confirmations and reminders by email.">
              <input className="input" name="email" type="email" defaultValue={me.email ?? ''} autoComplete="email" required />
            </Field>
            <Field label="Phone (optional)" hint="So your hairdresser can call if something comes up.">
              <input className="input" name="phone" type="tel" defaultValue={fmtPhone(me.phone)} autoComplete="tel" />
            </Field>
            <SubmitButton className="btn" pendingText="Saving…">
              Save
            </SubmitButton>
          </ActionForm>
        </section>

        <section className="card">
          <h2 className="mb-4 text-[24px]">Change password</h2>
          <ActionForm action={changePassword} className="flex flex-col gap-4">
            <Field label="Current password">
              <input className="input" name="current" type="password" autoComplete="current-password" required />
            </Field>
            <Field label="New password">
              <input className="input" name="password" type="password" autoComplete="new-password" minLength={6} required />
            </Field>
            <SubmitButton className="btn btn-soft" pendingText="Saving…">
              Change password
            </SubmitButton>
          </ActionForm>
        </section>

        <section className="card flex flex-col gap-3">
          <form action={logout}>
            <button className="btn btn-soft w-full">
              <LogOut size={18} /> Log out
            </button>
          </form>
          <form action={deleteProfile}>
            <ConfirmButton
              confirmText="Your profile and upcoming appointments will be deleted. This can't be undone."
              confirmLabel="Delete profile"
            >
              Delete my profile
            </ConfirmButton>
          </form>
        </section>
      </div>
    </>
  )
}
