import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/AuthShell'
import { ActionForm } from '@/components/ActionForm'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { getCustomer } from '@/lib/auth'
import { login } from '@/app/actions/customer'
import { DemoButtons } from '@/components/DemoButtons'

export const metadata: Metadata = { title: 'Log ind' }

function safeNext(next: unknown) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : ''
}

export default async function LoginPage(props: PageProps<'/log-ind'>) {
  const next = safeNext((await props.searchParams).next)
  // Links in emails go through here, so someone already logged in goes straight on.
  if (await getCustomer()) redirect(next || '/hjem')

  return (
    <AuthShell compact>
      <h1 className="text-[52px] leading-[0.98] md:text-[80px]">Log ind</h1>
      <p className="mt-3 text-[19px] text-muted">
        {next.startsWith('/book') ? 'Log ind, så er din nye tid klar til at blive booket.' : 'Velkommen tilbage.'}
      </p>
      <ActionForm action={login} className="mt-8 flex max-w-md flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Field label="E-mail">
          <input className="input" name="identifier" autoComplete="email" required inputMode="email" />
        </Field>
        <Field label="Adgangskode">
          <input className="input" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="btn mt-2" pendingText="Logger ind…">
          Log ind
        </SubmitButton>
      </ActionForm>
      <div className="mt-4 max-w-md">
        <DemoButtons only="kunde" />
      </div>
      <p className="mt-6 max-w-md text-[16px] text-muted">
        Ingen profil endnu?{' '}
        <Link href="/opret" className="text-ink underline underline-offset-4">
          Opret en her
        </Link>
        <br />
        Glemt adgangskoden? Skriv til din frisør, så får du en ny.
      </p>
    </AuthShell>
  )
}
