# Recipe: a booking app for a one-person appointment business

Paste this into your coding agent. Build the whole app; ask me only for things you cannot decide yourself, like the business name.

## What it does

Build a mobile-first booking web app for a solo service provider (for example a hairdresser) who works irregular days and serves a small group of regular customers. No payments.

- **Customers** sign up with name, email and password. They book in four steps on one page (treatment → date → time → confirm), see their upcoming appointments, move or cancel them, add them to their phone calendar, edit their profile (with an optional photo) and delete it.
- **The owner** logs in to an admin area with a single password from an environment variable. They open days for booking (with an option to repeat weekly), see a month and a week calendar, open a day in a side panel with its bookings and opening hours, book, move or delete appointments for customers, keep private notes per customer, edit treatments (category, name, description, duration, price range, visible or hidden, order), and see simple statistics.
- **Cancel a whole day** (e.g. illness): choose "illness" or type a reason; all remaining bookings that day are cancelled, the day closes, and each customer is emailed the reason plus a suggested next free time with a link that lands on the booking, ready to confirm.
- **Emails**: welcome, booking confirmation with an .ics attachment, moved, cancelled, a reminder the day before, and a notification to the owner when customers book, move or cancel.
- **Demo mode**: with no database configured, run on an in-memory Postgres seeded with made-up customers, bookings and opening hours around today, plus a thin bar to switch between the customer and owner views.

## Stack

- Next.js (App Router, Server Components, Server Actions), React, TypeScript, Tailwind CSS.
- Postgres via the Neon serverless HTTP driver; PGlite (in-memory) when no `DATABASE_URL` is set.
- Sessions in signed httpOnly cookies (`jose`), passwords hashed with Node's `scrypt`.
- Nodemailer over SMTP for email; Vercel Cron once a day for reminders.
- Hosting on Vercel, database on Neon, both on free plans.

## How it fits together

- Pages are server-rendered and read the database directly. Every mutation is a Server Action that checks the session first.
- The booking flow keeps its state in the URL (`?service=…&date=…&time=…`), so each step is a link and the page needs almost no client JavaScript.
- Free times are computed on the server: take the day's opening windows, merge overlaps, step through them in fixed increments, and drop slots that overlap existing bookings, are too soon, or don't fit the treatment's duration.
- Emails are sent after the response (Next's `after()`), so they never slow down a click. If SMTP isn't configured, emails are silently skipped.
- A `loading.tsx` per area and a small pending state on links make navigation feel instant.

## Data model

- `customers`: id, name, email (unique), phone (optional, unique), password_hash (null if the owner created them), avatar (small data URL), notes (owner only), created_at.
- `services`: id, category, name, description, duration_min, price_from, price_to (nullable), sort_order, active.
- `availability`: id, date (`YYYY-MM-DD` text), start_min, end_min (minutes after midnight).
- `bookings`: id, customer_id, service_id, plus a snapshot of service name, category and prices; date, start_min, end_min, note, status (`booked`/`cancelled`), cancelled_by (`customer`/`salon`), cancel_reason, reminded, created_at.

Store dates as text and times as minutes in the business's local time zone. Only convert to UTC when writing calendar files.

## Build it in this order

1. Project setup, design tokens, fonts, and a database layer that runs the Neon driver or PGlite behind one `query()` function. Create tables on the first request if they don't exist.
2. Customer signup, login and logout with cookie sessions; owner login with the env password.
3. Treatments seed list and the four-step booking flow with server-side slot calculation and a re-check on submit.
4. Customer home: next appointment card (calendar, move, cancel), later appointments, past visits.
5. .ics route and profile page (photo resized in the browser before upload).
6. Admin: overview, calendar (month + week + day panel with opening hours), booking form, customers list and detail, services editor, statistics.
7. Emails and the daily reminder cron.
8. Cancel-a-day with suggestions and the login-then-book smart link.
9. Demo mode with seeded sample data.

## Tools to connect

- A browser automation tool (e.g. a browser MCP server or Playwright) to click through every flow at phone and desktop sizes.
- Vercel and Neon accounts; an SMTP account (a Gmail app password works).

## Watch out for

- If the hosting project is created before the repo has code, the framework preset may be wrong and every route returns 404. Pin the framework in `vercel.json`.
- Run serverless functions in the same region as the database, or every query crosses an ocean.
- New environment variables only apply after a redeploy.
- React resets forms after a server action; submit manually so fields survive validation errors.
- Days and times must be computed in the business's time zone, including daylight saving changes.
- PGlite needs its `.wasm` and `.data` files included in the serverless bundle.
- Don't ship commercial fonts or real customer data in a public repo.

## Done when

- A customer can sign up, book, move and cancel on a phone, and gets the right emails with a working calendar file.
- The owner can open days, see bookings in month and week view, book for a customer, cancel a whole day, and every affected customer gets a suggested new time that books in two taps.
- Two customers can't get the same slot, and nobody can book outside opening hours.
- With no database configured, the app starts as a seeded demo; with one, it's a real system.
