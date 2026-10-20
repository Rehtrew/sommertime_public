import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/AuthShell'
import { ActionForm } from '@/components/ActionForm'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { getCustomer } from '@/lib/auth'
import { signup } from '@/app/actions/customer'

export const metadata: Metadata = { title: 'Create profile' }

export default async function SignupPage() {
  if (await getCustomer()) redirect('/home')

  return (
    <AuthShell compact>
      <h1 className="text-display">Create profile</h1>
      <p className="mt-3 text-body text-muted">It takes less than a minute.</p>
      <ActionForm action={signup} className="mt-8 flex max-w-md flex-col gap-4">
        <Field label="Your name">
          <input className="input" name="name" autoComplete="name" required />
        </Field>
        <Field label="Email" hint="You log in with it and get confirmations and reminders by email.">
          <input className="input" name="email" type="email" autoComplete="email" inputMode="email" required />
        </Field>
        <Field label="Choose a password" hint="At least 6 characters.">
          <input className="input" name="password" type="password" autoComplete="new-password" minLength={6} required />
        </Field>
        <SubmitButton className="btn mt-2" pendingText="Creating…">
          Create profile
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-small text-muted">
        Already have a profile?{' '}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
