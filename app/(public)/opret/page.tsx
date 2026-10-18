import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/AuthShell'
import { ActionForm } from '@/components/ActionForm'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { getCustomer } from '@/lib/auth'
import { signup } from '@/app/actions/customer'

export const metadata: Metadata = { title: 'Opret profil' }

export default async function SignupPage() {
  if (await getCustomer()) redirect('/hjem')

  return (
    <AuthShell compact>
      <h1 className="text-[52px] leading-[0.98] md:text-[80px]">Opret profil</h1>
      <p className="mt-3 text-[19px] text-muted">Det tager under et minut.</p>
      <ActionForm action={signup} className="mt-8 flex max-w-md flex-col gap-4">
        <Field label="Dit navn">
          <input className="input" name="name" autoComplete="name" required />
        </Field>
        <Field label="E-mail" hint="Du logger ind med den og får bekræftelser og påmindelser på mail.">
          <input className="input" name="email" type="email" autoComplete="email" inputMode="email" required />
        </Field>
        <Field label="Vælg en adgangskode" hint="Mindst 6 tegn.">
          <input className="input" name="password" type="password" autoComplete="new-password" minLength={6} required />
        </Field>
        <SubmitButton className="btn mt-2" pendingText="Opretter…">
          Opret profil
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-[16px] text-muted">
        Har du allerede en profil?{' '}
        <Link href="/log-ind" className="text-ink underline underline-offset-4">
          Log ind
        </Link>
      </p>
    </AuthShell>
  )
}
