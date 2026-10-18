import { Scissors, User } from 'lucide-react'
import { DEMO } from '@/lib/demo'
import { demoAsAdmin, demoAsCustomer } from '@/app/actions/demo'

/** One-click entry to the demo, as a customer or as the hairdresser. */
export function DemoButtons() {
  if (!DEMO) return null
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <form action={demoAsCustomer}>
        <button className="btn w-full">
          <User size={18} /> View as customer
        </button>
      </form>
      <form action={demoAsAdmin}>
        <button className="btn btn-white w-full">
          <Scissors size={18} /> View as hairdresser
        </button>
      </form>
    </div>
  )
}
