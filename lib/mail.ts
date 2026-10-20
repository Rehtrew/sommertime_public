import 'server-only'
import nodemailer from 'nodemailer'
import { fmtDate, fmtDuration, fmtTime } from './time'
import { cap, firstName, priceRange } from './format'
import { bookingIcs } from './ics'
import { SALON } from './salon'
import type { Booking } from './data'

export const SALON_NAME = SALON.name

const SMTP_VARS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as const

export function mailEnabled() {
  return SMTP_VARS.every((k) => !!process.env[k])
}

/** Booking notifications go to the sending email account and, if set, to ADMIN_EMAIL as well. */
export function adminRecipients() {
  const all = [process.env.SMTP_USER, process.env.ADMIN_EMAIL].filter((v): v is string => !!v?.trim())
  return [...new Set(all.map((v) => v.trim().toLowerCase()))]
}

/** Which mail settings are missing. Never exposes the password. */
export function mailStatus() {
  return {
    missing: SMTP_VARS.filter((k) => !process.env[k]),
    from: process.env.SMTP_USER ?? null,
    recipients: adminRecipients(),
  }
}

export function siteUrl() {
  const host = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (!host) return 'http://localhost:3000'
  return host.startsWith('http') ? host : `https://${host}`
}

export type Mail = {
  subject: string
  text: string
  html: string
  attachments?: { filename: string; content: string; contentType: string }[]
}

export async function sendMail(to: string | string[], mail: Mail) {
  if (!mailEnabled()) return false
  const port = Number(process.env.SMTP_PORT || 465)
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await transport.sendMail({
    from: process.env.MAIL_FROM || `${SALON_NAME} <${process.env.SMTP_USER}>`,
    to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    attachments: mail.attachments,
  })
  return true
}

type MailBooking = Pick<Booking, 'date' | 'start_min' | 'end_min' | 'service_name'> &
  Partial<Pick<Booking, 'note' | 'price_from' | 'price_to'>>

function when(b: MailBooking) {
  return `${fmtDate(b.date)} at ${fmtTime(b.start_min)}–${fmtTime(b.end_min)}`
}

// HTML email. Tables and inline styles, because that is what mail clients understand.
// Mail clients rarely load web fonts, so emails use the system font.

const FONT = `'General Sans', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif`
const INK = '#141414'
const MUTED = '#8d8d8d'
const LINE = '#e3e3e3'
const DANGER = '#d23c3c'
const DANGER_TILE = '#fcf0f0'

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function layout(o: {
  preheader: string
  label: string
  heading: string
  sub?: string
  /** The booking shown as time and duration. Left out for mails without a booking, like the welcome mail. */
  b?: MailBooking
  intro?: string
  /** Cancellations get a greyscale header, a red label and the time struck through. */
  cancelled?: boolean
  notice?: string
  /** Show the salon's address under the booking, with a link to the map. */
  place?: boolean
  /** Show the salon's address and phone number at the bottom. Used in customer emails. */
  contact?: boolean
  /** A suggested new time, shown in a soft box above the button. */
  suggestion?: { date: string; start_min: number }
  button: { text: string; href: string }
  /** A quiet text link under the button. */
  secondary?: { text: string; href: string }
  footer: string
}) {
  const site = siteUrl()
  const slot = o.cancelled ? `text-decoration:line-through;color:${MUTED};` : ''
  const text = (size: number, color = INK, extra = '') =>
    `margin:0;font-family:${FONT};font-size:${size}px;font-weight:500;line-height:1.3;color:${color};${extra}`
  const price = (b: MailBooking) => (b.price_from ? priceRange(b.price_from, b.price_to) : '')
  const bookingDetails = (b: MailBooking) => `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:1.5px dashed ${LINE};">
        <tr>
          <td width="50%" align="center" valign="top" style="padding:18px 8px 0;border-right:1.5px dashed ${LINE};">
            <p style="${text(14, MUTED)}">Date and time</p>
            <p style="${text(22, INK, `margin-top:4px;${slot}`)}">${fmtTime(b.start_min)}–${fmtTime(b.end_min)}</p>
            <p style="${text(14, MUTED, slot)}">${esc(cap(fmtDate(b.date)))}</p>
          </td>
          <td width="50%" align="center" valign="top" style="padding:18px 8px 0;">
            <p style="${text(14, MUTED)}">Duration</p>
            <p style="${text(22, INK, 'margin-top:4px;')}">${fmtDuration(b.end_min - b.start_min)}</p>
            ${price(b) ? `<p style="${text(14, MUTED)}">${price(b)}</p>` : ''}
          </td>
        </tr>
        </table>
        ${
          b.note
            ? `<p style="${text(16, MUTED, 'margin-top:24px;padding:14px 16px;background:#f4f4f4;border-radius:18px;line-height:1.45;')}">“${esc(b.note)}”</p>`
            : ''
        }`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(o.label)}</title>
<style>
  @import url('https://api.fontshare.com/v2/css?f[]=general-sans@500&display=swap');
  body { margin: 0; padding: 0; background: #ededed; }
  @media (max-width: 480px) { .h1 { font-size: 30px !important; } .pad { padding: 20px 16px 24px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:#ededed;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ededed;">
<tr><td align="center" style="padding:24px 12px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
    <tr><td style="padding:4px 10px 16px;"><p style="${text(20)}">${SALON_NAME}</p></td></tr>
    <tr><td style="background:#ffffff;border-radius:28px;padding:8px;">
      <img src="${site}/${o.cancelled ? 'mail-header-cancelled.jpg' : 'mail-header.jpg'}" width="504" alt="" style="display:block;width:100%;max-width:504px;height:auto;border:0;border-radius:22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="pad" style="padding:24px 20px 28px;">
        ${
          o.cancelled
            ? `<p style="margin:0 0 6px;"><span style="display:inline-block;padding:7px 16px;border-radius:999px;background:${DANGER_TILE};font-family:${FONT};font-size:17px;font-weight:500;line-height:1.2;color:${DANGER};">${esc(o.label)}</span></p>`
            : `<p style="${text(22, MUTED)}">${esc(o.label)}</p>`
        }
        <h1 class="h1" style="${text(36, INK, 'margin-top:4px;line-height:1.08;')}">${esc(o.heading)}</h1>
        ${o.sub ? `<p style="${text(19, INK, 'margin-top:8px;')}">${esc(o.sub)}</p>` : ''}
        ${o.b ? bookingDetails(o.b) : ''}
        ${
          o.place
            ? `<a href="${SALON.mapsHref}" style="display:block;margin-top:16px;padding:14px 16px;background:#f4f4f4;border-radius:18px;text-decoration:none;">
                <span style="${text(14, MUTED, 'display:block;')}">Location</span>
                <span style="${text(17, INK, 'display:block;')}">${esc(SALON.address)}</span>
              </a>`
            : ''
        }
        ${o.intro ? `<p style="${text(17, INK, 'margin-top:24px;line-height:1.45;')}">${esc(o.intro)}</p>` : ''}
        ${
          o.notice
            ? `<p style="${text(17, DANGER, `margin-top:24px;padding:14px 16px;background:${DANGER_TILE};border-radius:18px;line-height:1.45;`)}">${esc(o.notice)}</p>`
            : ''
        }
        ${
          o.suggestion
            ? `<p style="${text(14, MUTED, 'margin-top:24px;padding:16px 18px 0;background:#eef0fa;border-radius:18px 18px 0 0;')}">Next available time</p>
               <p style="${text(22, INK, 'padding:2px 18px 16px;background:#eef0fa;border-radius:0 0 18px 18px;line-height:1.2;')}">${esc(cap(fmtDate(o.suggestion.date)))} at ${fmtTime(o.suggestion.start_min)}</p>`
            : ''
        }
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:${o.suggestion ? 12 : 24}px;">
        <tr><td align="center" bgcolor="${INK}" style="border-radius:999px;">
          <a href="${o.button.href}" style="display:block;padding:17px 24px;font-family:${FONT};font-size:17px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(o.button.text)}</a>
        </td></tr>
        </table>
        ${
          o.secondary
            ? `<p style="${text(15, MUTED, 'margin-top:14px;text-align:center;')}"><a href="${o.secondary.href}" style="color:${INK};">${esc(o.secondary.text)}</a></p>`
            : ''
        }
      </td></tr>
      </table>
    </td></tr>
    ${
      o.contact
        ? `<tr><td align="center" style="padding:24px 16px 0;">
            <p style="${text(15, INK)}">${SALON_NAME}</p>
            <p style="${text(14, MUTED, 'margin-top:4px;line-height:1.5;')}">
              <a href="${SALON.mapsHref}" style="color:${MUTED};text-decoration:none;">${esc(SALON.address)}</a><br>
              <a href="${SALON.phoneHref}" style="color:${MUTED};text-decoration:none;">Phone ${SALON.phone}</a>
            </p>
          </td></tr>`
        : ''
    }
    <tr><td align="center" style="padding:${o.contact ? 12 : 20}px 16px 0;"><p style="${text(13, MUTED, 'line-height:1.5;')}">${esc(o.footer)}</p></td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

const ADMIN_COPY = {
  new: { label: 'New booking', subject: 'New booking', verb: 'has booked' },
  moved: { label: 'Booking moved', subject: 'Booking moved', verb: 'has moved their appointment to' },
  cancelled: { label: 'Booking cancelled', subject: 'Booking cancelled', verb: 'has cancelled' },
}

export function adminMail(kind: keyof typeof ADMIN_COPY, customerName: string, b: MailBooking): Mail {
  const copy = ADMIN_COPY[kind]
  const href = `${siteUrl()}/admin/calendar?date=${b.date}&day=1`
  const cancelled = kind === 'cancelled'
  return {
    subject: `${copy.subject}: ${customerName}, ${fmtDate(b.date)} at ${fmtTime(b.start_min)}`,
    text: [
      `${customerName} ${copy.verb}:`,
      '',
      b.service_name,
      when(b),
      b.note ? `\nMessage: ${b.note}` : '',
      '',
      href,
    ].join('\n'),
    html: layout({
      preheader: cancelled ? `${b.service_name} is cancelled. The time is available again.` : `${b.service_name}, ${when(b)}`,
      label: copy.label,
      heading: customerName,
      sub: b.service_name,
      b,
      cancelled,
      notice: cancelled ? 'The time is available again, so others can book it.' : undefined,
      button: { text: 'Open the calendar', href },
      footer: `Sent from your booking system`,
    }),
  }
}

/** Lets the hairdresser know when a customer books, moves or cancels. Fails silently. */
export async function notifyAdmin(kind: keyof typeof ADMIN_COPY, customerName: string, b: MailBooking) {
  const to = adminRecipients()
  if (!to.length || !mailEnabled()) {
    console.warn('Admin notification not sent. Missing:', mailStatus().missing.join(', '))
    return
  }
  try {
    await sendMail(to, adminMail(kind, customerName, b))
  } catch (err) {
    console.error('Could not send admin notification', err)
  }
}

export function reminderMail(name: string, b: MailBooking): Mail {
  const first = firstName(name)
  const href = `${siteUrl()}/home`
  return {
    subject: `Reminder: your appointment at ${SALON_NAME} tomorrow`,
    text: [
      `Hi ${first}`,
      '',
      `A quick reminder about your appointment tomorrow:`,
      '',
      b.service_name,
      when(b),
      '',
      `If you need to move or cancel, you can do it here: ${href}`,
      '',
      `See you soon`,
      SALON_NAME,
      SALON.address,
      `Phone ${SALON.phone}`,
    ].join('\n'),
    html: layout({
      preheader: `${b.service_name} tomorrow at ${fmtTime(b.start_min)}`,
      label: 'Tomorrow',
      heading: b.service_name,
      b: { ...b, note: undefined },
      intro: `Hi ${first}, we look forward to seeing you. If you need to move or cancel, you can do it on your page or call ${SALON.phone}.`,
      place: true,
      contact: true,
      button: { text: 'View your appointment', href },
      footer: `You're receiving this email because you have an appointment at ${SALON_NAME}.`,
    }),
  }
}

// Emails to the customer when a booking is made, moved or cancelled

const CUSTOMER_COPY = {
  booked: { label: 'Your appointment is booked', subject: 'Your appointment is booked' },
  moved: { label: 'Your appointment has been moved', subject: 'Your appointment has been moved' },
  cancelled: { label: 'Your appointment is cancelled', subject: 'Your appointment is cancelled' },
}

export type CustomerMailKind = keyof typeof CUSTOMER_COPY

export function customerMail(
  kind: CustomerMailKind,
  name: string,
  b: MailBooking & { id: number },
  /** 'salon' when the hairdresser made the change from admin. */
  by: 'customer' | 'salon' = 'customer',
): Mail {
  const copy = CUSTOMER_COPY[kind]
  const first = firstName(name)
  const cancelled = kind === 'cancelled'
  const intro = {
    booked:
      by === 'salon'
        ? `Hi ${first}, your hairdresser has booked an appointment for you. The calendar file is attached, so you can add it to your calendar.`
        : `Hi ${first}, thanks for your booking. The calendar file is attached, so you can add the appointment to your calendar.`,
    moved:
      by === 'salon'
        ? `Hi ${first}, your hairdresser has moved your appointment to this time. The updated calendar file is attached.`
        : `Hi ${first}, your appointment has been moved to this time. The updated calendar file is attached.`,
    cancelled:
      by === 'salon'
        ? `Hi ${first}, unfortunately your hairdresser has had to cancel your appointment. You're welcome to book a new one.`
        : `Hi ${first}, your appointment is cancelled. You're always welcome to book a new one.`,
  }[kind]
  const href = `${siteUrl()}${cancelled ? '/book' : '/home'}`
  return {
    subject: `${copy.subject}: ${b.service_name}, ${fmtDate(b.date)} at ${fmtTime(b.start_min)}`,
    text: [intro, '', b.service_name, when(b), cancelled ? '' : SALON.address, '', href, '', SALON_NAME, `Phone ${SALON.phone}`].join('\n'),
    html: layout({
      preheader: `${b.service_name}, ${when(b)}`,
      label: copy.label,
      heading: b.service_name,
      b: { ...b, note: undefined },
      cancelled,
      intro,
      place: !cancelled,
      contact: true,
      button: { text: cancelled ? 'Book a new appointment' : 'View your appointment', href },
      footer: `You're receiving this email because you have a profile at ${SALON_NAME}.`,
    }),
    attachments: cancelled
      ? undefined
      : [
          {
            filename: 'booking.ics',
            content: bookingIcs(b, SALON_NAME, `${siteUrl()}/home`),
            contentType: 'text/calendar; charset=utf-8',
          },
        ],
  }
}

/** Sends a confirmation to the customer, if they have an email. Fails silently. */
export async function notifyCustomer(
  kind: CustomerMailKind,
  customer: { name: string; email: string | null } | undefined,
  b: MailBooking & { id: number },
  by: 'customer' | 'salon' = 'customer',
) {
  if (!customer?.email || !mailEnabled()) return
  try {
    await sendMail(customer.email, customerMail(kind, customer.name, b, by))
  } catch (err) {
    console.error('Could not send email to the customer', err)
  }
}

/** Sent once, when a customer creates their profile. */
export function welcomeMail(name: string, email: string): Mail {
  const first = firstName(name)
  const href = `${siteUrl()}/book`
  const intro = `Your profile is ready, and you log in with ${email}. Here you can book, move and cancel your appointments, and you'll get a confirmation and a reminder by email.`
  return {
    subject: `Welcome to ${SALON_NAME}`,
    text: [`Hi ${first}`, '', intro, '', `Book your first appointment: ${href}`, '', SALON_NAME, SALON.address, `Phone ${SALON.phone}`].join('\n'),
    html: layout({
      preheader: 'Your profile is ready. Book your first appointment.',
      label: 'Welcome',
      heading: `Hi ${first}`,
      intro,
      contact: true,
      button: { text: 'Book an appointment', href },
      footer: `You're receiving this email because you created a profile at ${SALON_NAME}.`,
    }),
  }
}

export async function sendWelcome(customer: { name: string; email: string }) {
  if (!mailEnabled()) return
  try {
    await sendMail(customer.email, welcomeMail(customer.name, customer.email))
  } catch (err) {
    console.error('Could not send welcome email', err)
  }
}

/** Link that logs the customer in if needed and lands on the booking page, ready to confirm. */
export function bookingLink(serviceId: number | null, slot?: { date: string; start_min: number }) {
  const q = new URLSearchParams()
  if (serviceId) q.set('service', String(serviceId))
  if (serviceId && slot) {
    q.set('date', slot.date)
    q.set('time', String(slot.start_min))
  }
  const target = `/book${q.size ? `?${q}` : ''}${slot ? '#confirm' : ''}`
  return `${siteUrl()}/login?next=${encodeURIComponent(target)}`
}

export const SICK_REASON = 'Illness'

/** When the hairdresser cancels a whole day: the reason and the next free time. */
export function dayCancelledMail(
  name: string,
  b: MailBooking & { service_id: number | null },
  reason: string,
  suggestion?: { date: string; start_min: number },
): Mail {
  const first = firstName(name)
  const sick = reason === SICK_REASON
  const intro = sick
    ? `Hi ${first}, unfortunately your hairdresser is ill, so we have to cancel your appointment. We're very sorry.`
    : `Hi ${first}, unfortunately we have to cancel your appointment. We're very sorry.`
  const bookHref = bookingLink(b.service_id, suggestion)
  const otherHref = bookingLink(b.service_id)
  return {
    subject: `Your appointment is cancelled: ${b.service_name}, ${fmtDate(b.date)} at ${fmtTime(b.start_min)}`,
    text: [
      intro,
      sick ? '' : `Reason: ${reason}`,
      '',
      `${b.service_name}, ${when(b)}`,
      '',
      suggestion ? `Next available time: ${fmtDate(suggestion.date)} at ${fmtTime(suggestion.start_min)}` : '',
      suggestion ? `Book it here: ${bookHref}` : `Book a new appointment here: ${otherHref}`,
      '',
      SALON_NAME,
      SALON.address,
      `Phone ${SALON.phone}`,
    ].join('\n'),
    html: layout({
      preheader: suggestion
        ? `The next available time is ${fmtDate(suggestion.date)} at ${fmtTime(suggestion.start_min)}.`
        : 'Book a new appointment whenever it suits you.',
      label: 'Your appointment is cancelled',
      heading: b.service_name,
      b: { ...b, note: undefined },
      cancelled: true,
      intro,
      notice: sick ? undefined : `Reason: ${reason}`,
      suggestion,
      button: suggestion ? { text: 'Book this time', href: bookHref } : { text: 'Book a new appointment', href: otherHref },
      secondary: suggestion ? { text: 'See other available times', href: otherHref } : undefined,
      contact: true,
      footer: `You're receiving this email because you had an appointment at ${SALON_NAME}.`,
    }),
  }
}
