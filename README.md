# Studio Saks

A small, mobile-first booking system for a one-person hair salon with a handful of regular customers. No payments and no subscriptions: just opening hours, bookings, reminders and a customer list. The interface is in Danish.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRehtrew%2Fsommertime_public)

The deploy button gives you a working demo with zero configuration.

## Try the demo

With no database configured, the app runs as a self-contained demo:

- An in-memory Postgres ([PGlite](https://pglite.dev)) is filled with invented customers, bookings and opening hours around today's date.
- The front page has one-click buttons: **Se som kunde** (see it as a customer) and **Se som frisør** (see it as the hairdresser).
- Emails are not sent, but every email can be previewed from `/demo`.
- Everything resets when the server restarts.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## What it does

**For customers**

- Sign up with email, then book in four steps: treatment, date, time, confirm. Only times that fit the treatment's length are shown.
- Move or cancel a booking, and add it to their phone calendar (an `.ics` file with reminders the day before and two hours before).
- The salon's address with a map link, plus buttons to call or text the hairdresser.
- Emails: a welcome mail, a confirmation with the calendar file attached, a reminder the day before, and a notice if a time is moved or cancelled.

**For the hairdresser** (`/admin`)

- A month and a week calendar. Clicking a day opens a panel with that day's bookings on a timeline and its opening hours. From there she opens the day for booking, optionally every week for up to 12 weeks.
- **Cancel a whole day**, e.g. when ill. Every customer that day gets an email with the reason and a suggested next free time. Customers from the same day get different suggestions. A smart link logs them in if needed and lands on the booking, ready to confirm.
- Book, move or delete times on a customer's behalf, choosing whether the customer is emailed.
- A customer list with private notes (colour formulas, preferences) and visit history.
- Services with descriptions, price ranges and durations, grouped and ordered by category.
- Statistics: bookings per month, estimated revenue, popular treatments, most loyal customers, and customers not seen in over eight weeks.
- An email about every new, moved or cancelled booking.

## Run it for real

1. Deploy to Vercel and add a free **Neon** Postgres database under **Storage**. This sets `DATABASE_URL`, which turns demo mode off. Tables and starter services are created on the first request.
2. Set `ADMIN_PASSWORD` and `SESSION_SECRET` (e.g. `openssl rand -hex 32`).
3. For email, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASS`. A Gmail account with an app password works for free. A daily Vercel Cron job (`vercel.json`) sends the reminders.

See `.env.example` for every setting.

**Make it yours**

- `lib/salon.ts`: name, address and phone number.
- `lib/seed.ts`: the starter list of services.
- `public/flow.*`: the hero video.
- `app/layout.tsx`: the font.

## Tech

Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4, Postgres on Neon (PGlite in demo mode), signed-cookie sessions with `jose`, Nodemailer, and Vercel Cron.

## Design

Big type in a single font weight, no uppercase or letter-spacing, light grey surfaces and rounded corners. It is built for phones first, since that is where customers book. Dates and times are handled as Danish local time throughout.
