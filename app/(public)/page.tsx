import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/AuthShell'
import { getCustomer } from '@/lib/auth'

export default async function Landing(props: PageProps<'/'>) {
  if (await getCustomer()) redirect('/home')
  const { deleted } = await props.searchParams

  return (
    <AuthShell>
      {deleted && (
        <p className="fade-in mb-8 rounded-[20px] bg-card px-5 py-4 text-muted">
          Your profile has been deleted. Thanks for stopping by.
        </p>
      )}
      <h1 className="text-display">Book your next appointment</h1>
      <p className="mt-5 max-w-md text-body text-muted">
        Find a free time that suits you. Reschedule or cancel in one tap.
      </p>
      <div className="mt-9 grid gap-3 sm:max-w-md sm:grid-cols-2">
        <Link className="btn" href="/signup">
          Create profile
        </Link>
        <Link className="btn btn-white" href="/login">
          Log in
        </Link>
      </div>
    </AuthShell>
  )
}
