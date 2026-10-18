'use server'

import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { query, one } from '@/lib/db'
import {
  endCustomerSession,
  getCustomer,
  hashPassword,
  normalizePhone,
  parseIdentifier,
  requireCustomer,
  startCustomerSession,
  verifyPassword,
} from '@/lib/auth'
import { findOverlap, freeSlots, getBooking, getService, isUpcoming, type Booking, type Customer } from '@/lib/data'
import { isDate, today } from '@/lib/time'
import { notifyAdmin, notifyCustomer, sendWelcome } from '@/lib/mail'
import type { FormState } from '@/components/ActionForm'

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function findByIdentifier(id: { email: string } | { phone: string }) {
  return 'email' in id
    ? one<Customer>('SELECT * FROM customers WHERE email = $1', [id.email])
    : one<Customer>('SELECT * FROM customers WHERE phone = $1', [id.phone])
}

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, 'name')
  const email = str(fd, 'email').toLowerCase()
  const password = String(fd.get('password') ?? '')
  if (!name) return { error: 'Enter your name.' }
  if (!EMAIL_RE.test(email)) return { error: 'Enter a valid email.' }
  if (password.length < 6) return { error: 'The password must be at least 6 characters.' }

  const hash = await hashPassword(password)
  const existing = await findByIdentifier({ email })
  let customerId: number
  if (existing) {
    if (existing.password_hash) return { error: 'There is already a profile with that email. Log in instead.' }
    // The salon created this customer already: let them take over the profile.
    await query('UPDATE customers SET password_hash = $1, name = $2 WHERE id = $3', [hash, name, existing.id])
    customerId = existing.id
  } else {
    const row = await one<{ id: number }>(
      'INSERT INTO customers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hash],
    )
    customerId = row!.id
  }
  await startCustomerSession(customerId)
  after(() => sendWelcome({ name, email }))
  redirect('/profile?new=1')
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  // Email is the way in. Phone still works for profiles created before email became required.
  const id = parseIdentifier(str(fd, 'identifier'))
  const password = String(fd.get('password') ?? '')
  const fail = { error: 'Incorrect email or password.' }
  if (!id) return fail
  const customer = await findByIdentifier(id)
  if (!customer || !(await verifyPassword(password, customer.password_hash))) return fail
  await startCustomerSession(customer.id)
  const next = str(fd, 'next')
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/home')
}

export async function logout() {
  await endCustomerSession()
  redirect('/')
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireCustomer()
  const name = str(fd, 'name')
  const emailRaw = str(fd, 'email').toLowerCase()
  const phoneRaw = str(fd, 'phone')
  if (!name) return { error: 'Enter your name.' }
  if (!EMAIL_RE.test(emailRaw)) return { error: "Enter your email. It's what you log in with and where we send your updates." }
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null
  if (phoneRaw && !phone) return { error: "That phone number doesn't look right." }
  const email = emailRaw

  const clash = await one<{ id: number }>(
    'SELECT id FROM customers WHERE id <> $1 AND ((email IS NOT NULL AND email = $2) OR (phone IS NOT NULL AND phone = $3))',
    [me.id, email, phone],
  )
  if (clash) return { error: 'That email or phone number is already used by another profile.' }

  const avatar = String(fd.get('avatar') ?? '')
  let avatarValue = me.avatar
  if (avatar === 'remove') avatarValue = null
  else if (avatar.startsWith('data:image/') && avatar.length < 1_000_000) avatarValue = avatar

  await query('UPDATE customers SET name = $1, email = $2, phone = $3, avatar = $4 WHERE id = $5', [
    name,
    email,
    phone,
    avatarValue,
    me.id,
  ])
  revalidatePath('/', 'layout')
  return { ok: 'Your details have been saved.' }
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireCustomer()
  const current = String(fd.get('current') ?? '')
  const next = String(fd.get('password') ?? '')
  if (!(await verifyPassword(current, me.password_hash))) return { error: 'Your current password is incorrect.' }
  if (next.length < 6) return { error: 'The new password must be at least 6 characters.' }
  await query('UPDATE customers SET password_hash = $1 WHERE id = $2', [await hashPassword(next), me.id])
  return { ok: 'Your password has been changed.' }
}

export async function deleteProfile() {
  const me = await requireCustomer()
  // Future bookings go away. Past visits stay anonymous in the statistics.
  await query('DELETE FROM bookings WHERE customer_id = $1 AND date >= $2', [me.id, today()])
  await query('DELETE FROM customers WHERE id = $1', [me.id])
  await endCustomerSession()
  redirect('/?deleted=1')
}

export async function book(_: FormState, fd: FormData): Promise<FormState> {
  const me = await getCustomer()
  if (!me) redirect('/login')
  const serviceId = Number(fd.get('service'))
  const date = str(fd, 'date')
  const start = Number(fd.get('time'))
  const note = str(fd, 'note').slice(0, 500)
  const moveId = Number(fd.get('move')) || undefined

  const service = await getService(serviceId)
  if (!service || !service.active || !isDate(date) || !Number.isInteger(start)) return { error: 'Something went wrong. Please try again.' }

  let moving: Booking | undefined
  if (moveId) {
    moving = await getBooking(moveId)
    if (!moving || moving.customer_id !== me.id || moving.status !== 'booked' || !isUpcoming(moving)) {
      return { error: "This booking can't be moved." }
    }
  }

  // Re-check against the live calendar, someone may have taken the time meanwhile.
  const slots = await freeSlots(service.duration_min, moveId)
  if (!slots.get(date)?.includes(start)) {
    return { error: 'Sorry, that time is no longer available. Please choose another.' }
  }
  const end = start + service.duration_min
  if (await findOverlap(date, start, end, moveId)) return { error: 'Sorry, that time is no longer available. Please choose another.' }

  let bookingId: number
  if (moving) {
    await query(
      `UPDATE bookings SET service_id = $1, service_name = $2, category = $3, price_from = $4, price_to = $5,
       date = $6, start_min = $7, end_min = $8, note = $9, reminded = false WHERE id = $10`,
      [service.id, service.name, service.category, service.price_from, service.price_to, date, start, end, note, moving.id],
    )
    bookingId = moving.id
  } else {
    const row = await one<{ id: number }>(
      `INSERT INTO bookings (customer_id, service_id, service_name, category, price_from, price_to, date, start_min, end_min, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [me.id, service.id, service.name, service.category, service.price_from, service.price_to, date, start, end, note],
    )
    bookingId = row!.id
  }
  const info = {
    id: bookingId,
    date,
    start_min: start,
    end_min: end,
    service_name: service.name,
    note,
    price_from: service.price_from,
    price_to: service.price_to,
  }
  after(() =>
    Promise.all([
      notifyAdmin(moving ? 'moved' : 'new', me.name, info),
      notifyCustomer(moving ? 'moved' : 'booked', me, info),
    ]),
  )
  revalidatePath('/home')
  redirect(`/home?${moving ? 'moved' : 'booked'}=${bookingId}`)
}

export async function cancelBooking(fd: FormData) {
  const me = await requireCustomer()
  const id = Number(fd.get('id'))
  const b = await getBooking(id)
  if (!b || b.customer_id !== me.id || b.status !== 'booked' || !isUpcoming(b)) redirect('/home')
  await query(`UPDATE bookings SET status = 'cancelled', cancelled_by = 'customer' WHERE id = $1`, [id])
  after(() => Promise.all([notifyAdmin('cancelled', me.name, b), notifyCustomer('cancelled', me, b)]))
  revalidatePath('/home')
  redirect('/home?cancelled=1')
}
