'use server'

import { redirect } from 'next/navigation'
import { one } from '@/lib/db'
import { startAdminSession, startCustomerSession } from '@/lib/auth'
import { DEMO, DEMO_CUSTOMER_EMAIL } from '@/lib/demo'

export async function demoAsCustomer() {
  if (!DEMO) redirect('/')
  const c = await one<{ id: number }>('SELECT id FROM customers WHERE email = $1', [DEMO_CUSTOMER_EMAIL])
  if (c) await startCustomerSession(c.id)
  redirect('/hjem')
}

export async function demoAsAdmin() {
  if (!DEMO) redirect('/')
  await startAdminSession()
  redirect('/admin')
}
