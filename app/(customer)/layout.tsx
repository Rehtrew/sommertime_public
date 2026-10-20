import Link from 'next/link'
import { Avatar } from '@/components/Avatar'
import { requireCustomer } from '@/lib/auth'
import { SALON } from '@/lib/salon'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const me = await requireCustomer()
  return (
    <div className="min-h-svh pb-16">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 pt-5 pb-2 md:pt-8">
        <Link href="/home" className="text-title">
          {SALON.name}
        </Link>
        <Link href="/profile" aria-label="Your profile" className="rounded-full transition-transform active:scale-95">
          <Avatar name={me.name} src={me.avatar} size={44} />
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-3 md:px-5">{children}</main>
    </div>
  )
}
