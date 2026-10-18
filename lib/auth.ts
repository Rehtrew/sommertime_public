import 'server-only'
import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'
import { one } from './db'
import type { Customer } from './data'
import { DEMO } from './demo'

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

const CUSTOMER_COOKIE = 'st_session'
const ADMIN_COOKIE = 'st_admin'

function secret() {
  const s = process.env.SESSION_SECRET
  if (!s) {
    if (process.env.VERCEL && !DEMO) throw new Error('SESSION_SECRET is missing')
    return new TextEncoder().encode('local-development-secret-not-for-production')
  }
  return new TextEncoder().encode(s)
}

export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(pw, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export async function verifyPassword(pw: string, stored: string | null) {
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  const test = await scrypt(pw, Buffer.from(salt, 'hex'), 64)
  return timingSafeEqual(test, Buffer.from(hash, 'hex'))
}

/** Splits "Email or phone" into a normalized email or phone. */
export function parseIdentifier(raw: string): { email: string } | { phone: string } | null {
  const v = raw.trim()
  if (!v) return null
  if (v.includes('@')) {
    const email = v.toLowerCase()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { email } : null
  }
  const phone = normalizePhone(v)
  return phone ? { phone } : null
}

export function normalizePhone(raw: string) {
  let v = raw.replace(/[\s\-().]/g, '')
  if (v.startsWith('00')) v = `+${v.slice(2)}`
  if (/^\d{8}$/.test(v)) v = `+45${v}`
  return /^\+\d{8,15}$/.test(v) ? v : null
}

export function fmtPhone(phone: string | null) {
  if (!phone) return ''
  const m = /^\+45(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(phone)
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone
}

async function sign(payload: Record<string, unknown>, days: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret())
}

async function read(name: string) {
  const token = (await cookies()).get(name)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload
  } catch {
    return null
  }
}

async function setCookie(name: string, value: string, days: number) {
  ;(await cookies()).set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: days * 86400,
  })
}

// Customers

export async function startCustomerSession(customerId: number) {
  await setCookie(CUSTOMER_COOKIE, await sign({ cid: customerId }, 180), 180)
}

export async function endCustomerSession() {
  ;(await cookies()).delete(CUSTOMER_COOKIE)
}

// Cached per request, so the layout and the page share one database lookup.
export const getCustomer = cache(async () => {
  const payload = await read(CUSTOMER_COOKIE)
  if (!payload || typeof payload.cid !== 'number') return null
  const c = await one<Customer>('SELECT * FROM customers WHERE id = $1', [payload.cid])
  return c ?? null
})

export async function requireCustomer() {
  const c = await getCustomer()
  if (!c) redirect('/login')
  return c
}

// Admin: a single password from the ADMIN_PASSWORD environment variable.

function adminFingerprint() {
  // Changing ADMIN_PASSWORD logs out every existing admin session.
  return createHash('sha256')
    .update(`admin:${process.env.ADMIN_PASSWORD ?? (DEMO ? 'demo' : '')}`)
    .digest('hex')
    .slice(0, 16)
}

export function checkAdminPassword(pw: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const a = createHash('sha256').update(pw).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function startAdminSession() {
  await setCookie(ADMIN_COOKIE, await sign({ admin: adminFingerprint() }, 60), 60)
}

export async function endAdminSession() {
  ;(await cookies()).delete(ADMIN_COOKIE)
}

export async function isAdmin() {
  const payload = await read(ADMIN_COOKIE)
  return !!payload && (!!process.env.ADMIN_PASSWORD || DEMO) && payload.admin === adminFingerprint()
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login')
}
