import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/AuthShell'
import { ActionForm } from '@/components/ActionForm'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { getCustomer } from '@/lib/auth'
import { login } from '@/app/actions/customer'

export const metadata: Metadata = { title: 'Log in' }

function safeNext(next: unknown) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : ''
}

export default async function LoginPage(props: PageProps<'/login'>) {
  const next = safeNext((await props.searchParams).next)
  // Links in emails go through here, so someone already logged in goes straight on.
  if (await getCustomer()) redirect(next || '/home')

  return (
    <AuthShell compact>
      <h1 className="text-[52px] leading-[0.98] md:text-[80px]">Log in</h1>
      <p className="mt-3 text-[19px] text-muted">
        {next.startsWith('/book') ? 'Log in and your new appointment is ready to book.' : 'Welcome back.'}
      </p>
      <ActionForm action={login} className="mt-8 flex max-w-md flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email">
          <input className="input" name="identifier" autoComplete="email" required inputMode="email" />
        </Field>
        <Field label="Password">
          <input className="input" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="btn mt-2" pendingText="Logging in…">
          Log in
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 max-w-md text-[16px] text-muted">
        No profile yet?{' '}
        <Link href="/signup" className="text-ink underline underline-offset-4">
          Create one here
        </Link>
        <br />
        Forgot your password? Message your hairdresser for a new one.
      </p>
    </AuthShell>
  )
}
