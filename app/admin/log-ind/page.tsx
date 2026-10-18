import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/AuthShell'
import { ActionForm } from '@/components/ActionForm'
import { Field } from '@/components/Field'
import { SubmitButton } from '@/components/SubmitButton'
import { isAdmin } from '@/lib/auth'
import { adminLogin } from '@/app/actions/admin'
import { DemoButtons } from '@/components/DemoButtons'

export const metadata: Metadata = { title: 'Admin', robots: { index: false } }

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect('/admin')
  return (
    <AuthShell compact>
      <h1 className="text-[52px] leading-[0.98] md:text-[80px]">Admin</h1>
      <p className="mt-3 text-[19px] text-muted">Kun for frisøren.</p>
      <ActionForm action={adminLogin} className="mt-8 flex max-w-md flex-col gap-4">
        <input type="text" name="username" value="admin" autoComplete="username" readOnly hidden />
        <Field label="Adgangskode">
          <input className="input" name="password" type="password" autoComplete="current-password" required autoFocus />
        </Field>
        <SubmitButton className="btn mt-2" pendingText="Logger ind…">
          Log ind
        </SubmitButton>
      </ActionForm>
      <div className="mt-4 max-w-md">
        <DemoButtons only="frisør" />
      </div>
    </AuthShell>
  )
}
