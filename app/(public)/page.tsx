import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/AuthShell'
import { getCustomer } from '@/lib/auth'
import { DemoButtons } from '@/components/DemoButtons'
import { DEMO } from '@/lib/demo'

export default async function Landing(props: PageProps<'/'>) {
  if (await getCustomer()) redirect('/hjem')
  const { slettet } = await props.searchParams

  return (
    <AuthShell>
      {slettet && (
        <p className="fade-in mb-8 rounded-[20px] bg-card px-5 py-4 text-muted">
          Din profil er slettet. Tak for denne gang.
        </p>
      )}
      <h1 className="text-[52px] leading-[0.98] md:text-[88px]">Book din næste tid</h1>
      <p className="mt-5 max-w-md text-[19px] text-muted md:text-[22px]">
        Find en ledig tid, når det passer dig. Flyt eller aflys med et tryk.
      </p>
      {DEMO && (
        <div className="mt-9 sm:max-w-md">
          <p className="label">Prøv demoen med ét klik</p>
          <DemoButtons />
        </div>
      )}
      <div className={`${DEMO ? 'mt-3' : 'mt-9'} grid gap-3 sm:max-w-md sm:grid-cols-2`}>
        <Link className="btn" href="/opret">
          Opret profil
        </Link>
        <Link className="btn btn-white" href="/log-ind">
          Log ind
        </Link>
      </div>
    </AuthShell>
  )
}
