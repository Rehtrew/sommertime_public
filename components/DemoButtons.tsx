import { Scissors, User } from 'lucide-react'
import { DEMO } from '@/lib/demo'
import { demoAsAdmin, demoAsCustomer } from '@/app/actions/demo'

/** One-click entry to the demo, as a customer or as the hairdresser. */
export function DemoButtons({ only }: { only?: 'kunde' | 'frisør' }) {
  if (!DEMO) return null
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {only !== 'frisør' && (
        <form action={demoAsCustomer}>
          <button className="btn w-full !bg-pink">
            <User size={18} /> Se som kunde
          </button>
        </form>
      )}
      {only !== 'kunde' && (
        <form action={demoAsAdmin}>
          <button className="btn w-full !bg-pink">
            <Scissors size={18} /> Se som frisør
          </button>
        </form>
      )}
    </div>
  )
}
