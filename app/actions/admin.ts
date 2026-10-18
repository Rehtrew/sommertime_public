'use server'

import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { query, one } from '@/lib/db'
import {
  checkAdminPassword,
  endAdminSession,
  hashPassword,
  normalizePhone,
  requireAdmin,
  startAdminSession,
} from '@/lib/auth'
import {
  categoriesInOrder,
  findOverlap,
  freeSlots,
  getBooking,
  getService,
  getServices,
  isUpcoming,
  overlapMessage,
  type Booking,
} from '@/lib/data'
import { addDays, isDate, parseTime, today } from '@/lib/time'
import { dayCancelledMail, mailEnabled, notifyCustomer, sendMail, SICK_REASON, type CustomerMailKind } from '@/lib/mail'
import type { FormState } from '@/components/ActionForm'

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()
const int = (fd: FormData, key: string) => {
  const v = str(fd, key)
  return v === '' ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN
}

// Session

export async function adminLogin(_: FormState, fd: FormData): Promise<FormState> {
  if (!process.env.ADMIN_PASSWORD) return { error: 'ADMIN_PASSWORD er ikke sat i miljøvariablerne.' }
  if (!checkAdminPassword(String(fd.get('password') ?? ''))) return { error: 'Forkert adgangskode.' }
  await startAdminSession()
  redirect('/admin')
}

export async function adminLogout() {
  await endAdminSession()
  redirect('/admin/log-ind')
}

// Opening hours

export async function addWindow(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const date = str(fd, 'date')
  const start = parseTime(fd.get('start'))
  const end = parseTime(fd.get('end'))
  const repeat = Math.min(Math.max(Number(fd.get('repeat')) || 0, 0), 26)
  if (!isDate(date)) return { error: 'Vælg en dato.' }
  if (start === null || end === null || end <= start) return { error: 'Sluttid skal være efter starttid.' }
  for (let w = 0; w <= repeat; w++) {
    await query('INSERT INTO availability (date, start_min, end_min) VALUES ($1, $2, $3)', [addDays(date, w * 7), start, end])
  }
  revalidatePath('/admin', 'layout')
  return { ok: repeat ? `Tilføjet ${repeat + 1} uger i træk.` : 'Tilføjet.' }
}

export async function deleteWindow(fd: FormData) {
  await requireAdmin()
  await query('DELETE FROM availability WHERE id = $1', [Number(fd.get('id'))])
  revalidatePath('/admin', 'layout')
}

// Services

function readService(fd: FormData) {
  const name = str(fd, 'name')
  const category = str(fd, 'category')
  const duration = int(fd, 'duration')
  const from = int(fd, 'price_from')
  const to = int(fd, 'price_to')
  if (!name || !category) return { error: 'Navn og kategori skal udfyldes.' } as const
  if (!duration || duration < 5 || duration > 600) return { error: 'Varighed skal være mellem 5 og 600 minutter.' } as const
  if (from === null || Number.isNaN(from) || from < 0) return { error: 'Skriv en pris.' } as const
  if (Number.isNaN(to) || (to !== null && to < from)) return { error: '"Pris til" skal være højere end "pris fra".' } as const
  return {
    value: {
      name,
      category,
      description: str(fd, 'description'),
      duration,
      from,
      to: to === from ? null : to,
      active: fd.get('active') === 'on',
    },
  } as const
}

export async function createService(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const r = readService(fd)
  if ('error' in r) return { error: r.error }
  const s = r.value
  await query(
    `INSERT INTO services (category, name, description, duration_min, price_from, price_to, active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,(SELECT coalesce(max(sort_order), 0) + 1 FROM services))`,
    [s.category, s.name, s.description, s.duration, s.from, s.to, true],
  )
  revalidatePath('/admin/ydelser')
  redirect('/admin/ydelser?gemt=1')
}

export async function updateService(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const r = readService(fd)
  if ('error' in r) return { error: r.error }
  const s = r.value
  await query(
    `UPDATE services SET category=$1, name=$2, description=$3, duration_min=$4, price_from=$5, price_to=$6, active=$7 WHERE id=$8`,
    [s.category, s.name, s.description, s.duration, s.from, s.to, s.active, Number(fd.get('id'))],
  )
  revalidatePath('/admin/ydelser')
  return { ok: 'Gemt.' }
}

export async function moveService(fd: FormData) {
  await requireAdmin()
  const id = Number(fd.get('id'))
  const dir = fd.get('dir') === 'up' ? -1 : 1
  const current = await getService(id)
  if (!current) return
  const neighbour = await one<{ id: number; sort_order: number }>(
    dir < 0
      ? 'SELECT id, sort_order FROM services WHERE category = $1 AND (sort_order, id) < ($2, $3) ORDER BY sort_order DESC, id DESC LIMIT 1'
      : 'SELECT id, sort_order FROM services WHERE category = $1 AND (sort_order, id) > ($2, $3) ORDER BY sort_order, id LIMIT 1',
    [current.category, current.sort_order, current.id],
  )
  if (!neighbour) return
  const a = neighbour.sort_order === current.sort_order ? current.sort_order + dir : neighbour.sort_order
  await query('UPDATE services SET sort_order = $1 WHERE id = $2', [a, current.id])
  await query('UPDATE services SET sort_order = $1 WHERE id = $2', [current.sort_order, neighbour.id])
  revalidatePath('/admin/ydelser')
}

/** Moves a whole category up or down by renumbering every service in the new order. */
export async function moveCategory(fd: FormData) {
  await requireAdmin()
  const services = await getServices(true)
  const cats = categoriesInOrder(services)
  const i = cats.indexOf(str(fd, 'category'))
  const j = i + (fd.get('dir') === 'up' ? -1 : 1)
  if (i < 0 || j < 0 || j >= cats.length) return
  ;[cats[i], cats[j]] = [cats[j], cats[i]]
  let n = 0
  for (const cat of cats) {
    for (const s of services.filter((x) => x.category === cat)) {
      await query('UPDATE services SET sort_order = $1 WHERE id = $2', [n++, s.id])
    }
  }
  revalidatePath('/admin/ydelser')
}

export async function deleteService(fd: FormData) {
  await requireAdmin()
  await query('DELETE FROM services WHERE id = $1', [Number(fd.get('id'))])
  revalidatePath('/admin/ydelser')
  redirect('/admin/ydelser')
}

// Customers

async function readCustomer(fd: FormData, ignoreId = 0) {
  const name = str(fd, 'name')
  const email = str(fd, 'email').toLowerCase() || null
  const phoneRaw = str(fd, 'phone')
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null
  if (!name) return { error: 'Skriv et navn.' } as const
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'E-mailen ser ikke rigtig ud.' } as const
  if (phoneRaw && !phone) return { error: 'Telefonnummeret ser ikke rigtigt ud.' } as const
  const clash = await one<{ name: string }>(
    'SELECT name FROM customers WHERE id <> $1 AND ((email IS NOT NULL AND email = $2) OR (phone IS NOT NULL AND phone = $3))',
    [ignoreId, email, phone],
  )
  if (clash) return { error: `E-mail eller telefon bruges allerede af ${clash.name}.` } as const
  return { value: { name, email, phone, notes: str(fd, 'notes') } } as const
}

export async function createCustomer(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const r = await readCustomer(fd)
  if ('error' in r) return { error: r.error }
  const c = r.value
  const row = await one<{ id: number }>(
    'INSERT INTO customers (name, email, phone, notes) VALUES ($1,$2,$3,$4) RETURNING id',
    [c.name, c.email, c.phone, c.notes],
  )
  revalidatePath('/admin', 'layout')
  redirect(`/admin/kunder/${row!.id}`)
}

export async function updateCustomer(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const id = Number(fd.get('id'))
  const r = await readCustomer(fd, id)
  if ('error' in r) return { error: r.error }
  const c = r.value
  await query('UPDATE customers SET name=$1, email=$2, phone=$3 WHERE id=$4', [c.name, c.email, c.phone, id])
  revalidatePath('/admin', 'layout')
  return { ok: 'Gemt.' }
}

export async function saveNotes(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  await query('UPDATE customers SET notes = $1 WHERE id = $2', [str(fd, 'notes'), Number(fd.get('id'))])
  revalidatePath('/admin/kunder')
  return { ok: 'Noter gemt.' }
}

export async function setCustomerPassword(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const pw = String(fd.get('password') ?? '')
  if (pw.length < 6) return { error: 'Mindst 6 tegn.' }
  await query('UPDATE customers SET password_hash = $1 WHERE id = $2', [await hashPassword(pw), Number(fd.get('id'))])
  return { ok: 'Ny adgangskode sat. Giv den til kunden, så de kan logge ind.' }
}

export async function deleteCustomer(fd: FormData) {
  await requireAdmin()
  const id = Number(fd.get('id'))
  // Same as when customers delete themselves: past visits stay anonymous in the statistics.
  await query('DELETE FROM bookings WHERE customer_id = $1 AND date >= $2', [id, today()])
  await query('DELETE FROM customers WHERE id = $1', [id])
  revalidatePath('/admin', 'layout')
  redirect('/admin/kunder')
}

// Bookings made by the hairdresser

export async function saveBooking(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const id = Number(fd.get('id')) || 0
  const customerId = Number(fd.get('customer'))
  const service = await getService(Number(fd.get('service')))
  const date = str(fd, 'date')
  const start = parseTime(fd.get('time'))
  const durationOverride = int(fd, 'duration')
  if (!customerId) return { error: 'Vælg en kunde.' }
  if (!service) return { error: 'Vælg en behandling.' }
  if (!isDate(date)) return { error: 'Vælg en dato.' }
  if (start === null) return { error: 'Vælg et tidspunkt.' }
  if (Number.isNaN(durationOverride) || (durationOverride !== null && (durationOverride < 5 || durationOverride > 600))) {
    return { error: 'Varighed skal være mellem 5 og 600 minutter.' }
  }
  const end = start + (durationOverride ?? service.duration_min)
  if (end > 24 * 60) return { error: 'Behandlingen slutter efter midnat.' }

  const overlap = await findOverlap(date, start, end, id)
  if (overlap) return { error: overlapMessage(overlap) }

  const note = str(fd, 'note').slice(0, 500)
  let bookingId = id
  let mailKind: CustomerMailKind | null = null
  if (id) {
    const existing = await getBooking(id)
    if (!existing) return { error: 'Bookingen findes ikke længere.' }
    const changedTime = existing.date !== date || existing.start_min !== start
    if (existing.status === 'cancelled' || existing.customer_id !== customerId) mailKind = 'booket'
    else if (changedTime || existing.end_min !== end || existing.service_id !== service.id) mailKind = 'flyttet'
    await query(
      `UPDATE bookings SET customer_id=$1, service_id=$2, service_name=$3, category=$4, price_from=$5, price_to=$6,
       date=$7, start_min=$8, end_min=$9, note=$10, status='booked', cancelled_by=NULL, cancel_reason=NULL, reminded = reminded AND NOT $11 WHERE id=$12`,
      [customerId, service.id, service.name, service.category, service.price_from, service.price_to, date, start, end, note, changedTime, id],
    )
  } else {
    const row = await one<{ id: number }>(
      `INSERT INTO bookings (customer_id, service_id, service_name, category, price_from, price_to, date, start_min, end_min, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [customerId, service.id, service.name, service.category, service.price_from, service.price_to, date, start, end, note],
    )
    bookingId = row!.id
    mailKind = 'booket'
  }
  const kind = mailKind
  if (kind && fd.get('notify') === 'on' && isUpcoming({ date, start_min: start })) {
    const customer = await one<{ name: string; email: string | null }>('SELECT name, email FROM customers WHERE id = $1', [customerId])
    const info = { id: bookingId, date, start_min: start, end_min: end, service_name: service.name, price_from: service.price_from, price_to: service.price_to }
    after(() => notifyCustomer(kind, customer, info, 'salon'))
  }
  revalidatePath('/admin', 'layout')
  redirect(`/admin/kalender?date=${date}&dag=1`)
}

export async function deleteBooking(fd: FormData) {
  await requireAdmin()
  const b = await getBooking(Number(fd.get('id')))
  if (b) {
    await query('DELETE FROM bookings WHERE id = $1', [b.id])
    if (fd.get('notify') === 'on' && b.customer_id && b.status === 'booked' && isUpcoming(b)) {
      const customer = await one<{ name: string; email: string | null }>('SELECT name, email FROM customers WHERE id = $1', [b.customer_id])
      after(() => notifyCustomer('aflyst', customer, b, 'salon'))
    }
  }
  revalidatePath('/admin', 'layout')
  redirect(b ? `/admin/kalender?date=${b.date}&dag=1` : '/admin/kalender')
}

// Cancelling a whole day, e.g. when the hairdresser is ill

export async function cancelDay(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const date = str(fd, 'date')
  if (!isDate(date) || date < today()) return { error: 'Dagen kan ikke aflyses.' }
  const custom = str(fd, 'custom').slice(0, 300)
  if (fd.get('reason') === 'egen' && !custom) return { error: 'Skriv en årsag, eller vælg sygdom.' }
  const reason = fd.get('reason') === 'egen' ? custom : SICK_REASON

  const affected = (
    await query<Booking & { email: string | null }>(
      `SELECT b.*, c.name AS customer_name, c.email FROM bookings b LEFT JOIN customers c ON c.id = b.customer_id
       WHERE b.date = $1 AND b.status = 'booked' ORDER BY b.start_min`,
      [date],
    )
  ).filter(isUpcoming)
  for (const b of affected) {
    await query(`UPDATE bookings SET status = 'cancelled', cancelled_by = 'salon', cancel_reason = $1 WHERE id = $2`, [reason, b.id])
  }
  await query('DELETE FROM availability WHERE date = $1', [date])

  const recipients = fd.get('notify') === 'on' && mailEnabled() ? affected.filter((b) => b.email) : []
  if (recipients.length) after(() => mailDayCancelled(recipients, reason))

  revalidatePath('/admin', 'layout')
  const back = str(fd, 'back')
  const base = back.startsWith('/admin/kalender') ? back : `/admin/kalender?date=${date}&dag=1`
  redirect(`${base}&aflyst=${affected.length}&mailet=${recipients.length}`)
}

/** Emails each customer with the next free time. Customers from the same day get different suggestions. */
async function mailDayCancelled(bookings: (Booking & { email: string | null })[], reason: string) {
  const suggested: { date: string; start: number; end: number }[] = []
  for (const b of bookings) {
    const service = b.service_id ? await getService(b.service_id) : undefined
    let suggestion: { date: string; start_min: number } | undefined
    if (service?.active) {
      const duration = service.duration_min
      search: for (const [d, times] of await freeSlots(duration)) {
        for (const start of times) {
          if (suggested.some((s) => s.date === d && start < s.end && start + duration > s.start)) continue
          suggestion = { date: d, start_min: start }
          suggested.push({ date: d, start, end: start + duration })
          break search
        }
      }
    }
    try {
      await sendMail(b.email!, dayCancelledMail(b.customer_name ?? '', { ...b, service_id: service?.active ? b.service_id : null }, reason, suggestion))
    } catch (err) {
      console.error('Kunne ikke sende aflysning til kunden', b.id, err)
    }
  }
}
