import 'server-only'
import { neon } from '@neondatabase/serverless'
import { SEED_SERVICES } from './seed'
import { DEMO, seedDemo } from './demo'

type Row = Record<string, unknown>
type Client = { query: (text: string, params?: unknown[]) => Promise<Row[]> }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  avatar TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_min INT NOT NULL,
  price_from INT NOT NULL,
  price_to INT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS availability (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  start_min INT NOT NULL,
  end_min INT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  service_id INT REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  price_from INT NOT NULL DEFAULT 0,
  price_to INT,
  date TEXT NOT NULL,
  start_min INT NOT NULL,
  end_min INT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'booked',
  cancelled_by TEXT,
  cancel_reason TEXT,
  reminded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings(date);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS availability_date_idx ON availability(date);
`

const g = globalThis as unknown as { __db?: Promise<Client> }

async function connect(): Promise<Client> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  let client: Client
  if (url) {
    const sql = neon(url)
    client = { query: (text, params) => sql.query(text, params ?? []) as Promise<Row[]> }
  } else {
    // No database configured: run as a demo on an in-memory Postgres (see lib/demo.ts).
    const { PGlite } = await import('@electric-sql/pglite')
    const pg = new PGlite()
    client = { query: async (text, params) => (await pg.query<Row>(text, params ?? [])).rows }
  }
  // One cheap check per cold start. Tables and starter services are only created the very first time.
  const [{ ready, v2 }] = await client.query(
    `SELECT to_regclass('public.bookings') IS NOT NULL AS ready,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'cancelled_by') AS v2`,
  )
  if (ready && !v2) {
    // Added later: who cancelled a booking ('customer' or 'salon') and why.
    await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by TEXT, ADD COLUMN IF NOT EXISTS cancel_reason TEXT')
  }
  if (!ready) {
    for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
      await client.query(stmt)
    }
    for (const [i, s] of SEED_SERVICES.entries()) {
      await client.query(
        'INSERT INTO services (category, name, description, duration_min, price_from, price_to, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [s.category, s.name, s.description, s.duration, s.from, s.to ?? null, i],
      )
    }
    if (DEMO) await seedDemo(client.query)
  }
  return client
}

function db() {
  if (!g.__db) {
    g.__db = connect().catch((err) => {
      g.__db = undefined
      throw err
    })
  }
  return g.__db
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const client = await db()
  return (await client.query(text, params)) as T[]
}

export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await query<T>(text, params)
  return rows[0]
}
