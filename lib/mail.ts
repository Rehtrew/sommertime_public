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
  return `${fmtDate(b.date)} kl. ${fmtTime(b.start_min)}–${fmtTime(b.end_min)}`
}

// HTML email. Tables and inline styles, because that is what mail clients understand.
// Mail clients rarely load web fonts, so emails use the system font.

const FONT = `-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif`
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
            <p style="${text(14, MUTED)}">Dato og tid</p>
            <p style="${text(22, INK, `margin-top:4px;${slot}`)}">${fmtTime(b.start_min)}–${fmtTime(b.end_min)}</p>
            <p style="${text(14, MUTED, slot)}">${esc(cap(fmtDate(b.date)))}</p>
          </td>
          <td width="50%" align="center" valign="top" style="padding:18px 8px 0;">
            <p style="${text(14, MUTED)}">Varighed</p>
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
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(o.label)}</title>
<style>
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
      <img src="${site}/${o.cancelled ? 'mail-header-aflyst.jpg' : 'mail-header.jpg'}" width="504" alt="" style="display:block;width:100%;max-width:504px;height:auto;border:0;border-radius:22px;">
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
                <span style="${text(14, MUTED, 'display:block;')}">Sted</span>
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
            ? `<p style="${text(14, MUTED, 'margin-top:24px;padding:16px 18px 0;background:#eef0fa;border-radius:18px 18px 0 0;')}">Næste ledige tid</p>
               <p style="${text(22, INK, 'padding:2px 18px 16px;background:#eef0fa;border-radius:0 0 18px 18px;line-height:1.2;')}">${esc(cap(fmtDate(o.suggestion.date)))} kl. ${fmtTime(o.suggestion.start_min)}</p>`
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
              <a href="${SALON.phoneHref}" style="color:${MUTED};text-decoration:none;">Tlf. ${SALON.phone}</a>
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
  ny: { label: 'Ny booking', subject: 'Ny booking', verb: 'har booket' },
  flyttet: { label: 'Booking flyttet', subject: 'Booking flyttet', verb: 'har flyttet sin tid til' },
  aflyst: { label: 'Booking aflyst', subject: 'Booking aflyst', verb: 'har aflyst' },
}

export function adminMail(kind: keyof typeof ADMIN_COPY, customerName: string, b: MailBooking): Mail {
  const copy = ADMIN_COPY[kind]
  const href = `${siteUrl()}/admin/kalender?date=${b.date}&dag=1`
  const cancelled = kind === 'aflyst'
  return {
    subject: `${copy.subject}: ${customerName}, ${fmtDate(b.date)} kl. ${fmtTime(b.start_min)}`,
    text: [
      `${customerName} ${copy.verb}:`,
      '',
      b.service_name,
      when(b),
      b.note ? `\nBesked: ${b.note}` : '',
      '',
      href,
    ].join('\n'),
    html: layout({
      preheader: cancelled ? `${b.service_name} er aflyst. Tiden er ledig igen.` : `${b.service_name}, ${when(b)}`,
      label: copy.label,
      heading: customerName,
      sub: b.service_name,
      b,
      cancelled,
      notice: cancelled ? 'Tiden er ledig igen, så andre kan booke den.' : undefined,
      button: { text: 'Åbn kalenderen', href },
      footer: `Sendt fra dit bookingsystem`,
    }),
  }
}

/** Lets the hairdresser know when a customer books, moves or cancels. Fails silently. */
export async function notifyAdmin(kind: keyof typeof ADMIN_COPY, customerName: string, b: MailBooking) {
  const to = adminRecipients()
  if (!to.length || !mailEnabled()) {
    console.warn('Besked til admin ikke sendt. Mangler:', mailStatus().missing.join(', '))
    return
  }
  try {
    await sendMail(to, adminMail(kind, customerName, b))
  } catch (err) {
    console.error('Kunne ikke sende besked til admin', err)
  }
}

export function reminderMail(name: string, b: MailBooking): Mail {
  const first = firstName(name)
  const href = `${siteUrl()}/hjem`
  return {
    subject: `Påmindelse: din tid i morgen hos ${SALON_NAME}`,
    text: [
      `Hej ${first}`,
      '',
      `En lille påmindelse om din tid i morgen:`,
      '',
      b.service_name,
      when(b),
      '',
      `Skal du flytte eller aflyse, kan du gøre det her: ${href}`,
      '',
      `Vi ses`,
      SALON_NAME,
      SALON.address,
      `Tlf. ${SALON.phone}`,
    ].join('\n'),
    html: layout({
      preheader: `${b.service_name} i morgen kl. ${fmtTime(b.start_min)}`,
      label: 'I morgen',
      heading: b.service_name,
      b: { ...b, note: undefined },
      intro: `Hej ${first}, vi glæder os til at se dig. Skal du flytte eller aflyse, kan du gøre det på din side eller ringe på ${SALON.phone}.`,
      place: true,
      contact: true,
      button: { text: 'Se din tid', href },
      footer: `Du får denne mail, fordi du har en tid hos ${SALON_NAME}.`,
    }),
  }
}

// Emails to the customer when a booking is made, moved or cancelled

const CUSTOMER_COPY = {
  booket: { label: 'Din tid er booket', subject: 'Din tid er booket' },
  flyttet: { label: 'Din tid er flyttet', subject: 'Din tid er flyttet' },
  aflyst: { label: 'Din tid er aflyst', subject: 'Din tid er aflyst' },
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
  const cancelled = kind === 'aflyst'
  const intro = {
    booket:
      by === 'salon'
        ? `Hej ${first}, din frisør har booket en tid til dig. Kalenderfilen er vedhæftet, så du kan lægge den i din kalender.`
        : `Hej ${first}, tak for din booking. Kalenderfilen er vedhæftet, så du kan lægge tiden i din kalender.`,
    flyttet:
      by === 'salon'
        ? `Hej ${first}, din frisør har flyttet din tid til tidspunktet her. Den opdaterede kalenderfil er vedhæftet.`
        : `Hej ${first}, din tid er flyttet til tidspunktet her. Den opdaterede kalenderfil er vedhæftet.`,
    aflyst:
      by === 'salon'
        ? `Hej ${first}, din frisør har desværre måttet aflyse din tid. Du er velkommen til at booke en ny.`
        : `Hej ${first}, din tid er aflyst. Du er altid velkommen til at booke en ny.`,
  }[kind]
  const href = `${siteUrl()}${cancelled ? '/book' : '/hjem'}`
  return {
    subject: `${copy.subject}: ${b.service_name}, ${fmtDate(b.date)} kl. ${fmtTime(b.start_min)}`,
    text: [intro, '', b.service_name, when(b), cancelled ? '' : SALON.address, '', href, '', SALON_NAME, `Tlf. ${SALON.phone}`].join('\n'),
    html: layout({
      preheader: `${b.service_name}, ${when(b)}`,
      label: copy.label,
      heading: b.service_name,
      b: { ...b, note: undefined },
      cancelled,
      intro,
      place: !cancelled,
      contact: true,
      button: { text: cancelled ? 'Book en ny tid' : 'Se din tid', href },
      footer: `Du får denne mail, fordi du har en profil hos ${SALON_NAME}.`,
    }),
    attachments: cancelled
      ? undefined
      : [
          {
            filename: 'booking.ics',
            content: bookingIcs(b, SALON_NAME, `${siteUrl()}/hjem`),
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
    console.error('Kunne ikke sende mail til kunden', err)
  }
}

/** Sent once, when a customer creates their profile. */
export function welcomeMail(name: string, email: string): Mail {
  const first = firstName(name)
  const href = `${siteUrl()}/book`
  const intro = `Din profil er klar, og du logger ind med ${email}. Her kan du booke, flytte og aflyse dine tider, og du får en bekræftelse og en påmindelse på mail.`
  return {
    subject: `Velkommen til ${SALON_NAME}`,
    text: [`Hej ${first}`, '', intro, '', `Book din første tid: ${href}`, '', SALON_NAME, SALON.address, `Tlf. ${SALON.phone}`].join('\n'),
    html: layout({
      preheader: 'Din profil er klar. Book din første tid.',
      label: 'Velkommen',
      heading: `Hej ${first}`,
      intro,
      contact: true,
      button: { text: 'Book en tid', href },
      footer: `Du får denne mail, fordi du har oprettet en profil hos ${SALON_NAME}.`,
    }),
  }
}

export async function sendWelcome(customer: { name: string; email: string }) {
  if (!mailEnabled()) return
  try {
    await sendMail(customer.email, welcomeMail(customer.name, customer.email))
  } catch (err) {
    console.error('Kunne ikke sende velkomstmail', err)
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
  const target = `/book${q.size ? `?${q}` : ''}${slot ? '#bekraeft' : ''}`
  return `${siteUrl()}/log-ind?next=${encodeURIComponent(target)}`
}

export const SICK_REASON = 'Sygdom'

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
    ? `Hej ${first}, din frisør er desværre blevet syg, så vi er nødt til at aflyse din tid. Vi beklager meget.`
    : `Hej ${first}, vi er desværre nødt til at aflyse din tid. Vi beklager meget.`
  const bookHref = bookingLink(b.service_id, suggestion)
  const otherHref = bookingLink(b.service_id)
  return {
    subject: `Din tid er aflyst: ${b.service_name}, ${fmtDate(b.date)} kl. ${fmtTime(b.start_min)}`,
    text: [
      intro,
      sick ? '' : `Årsag: ${reason}`,
      '',
      `${b.service_name}, ${when(b)}`,
      '',
      suggestion ? `Næste ledige tid: ${fmtDate(suggestion.date)} kl. ${fmtTime(suggestion.start_min)}` : '',
      suggestion ? `Book den her: ${bookHref}` : `Book en ny tid her: ${otherHref}`,
      '',
      SALON_NAME,
      SALON.address,
      `Tlf. ${SALON.phone}`,
    ].join('\n'),
    html: layout({
      preheader: suggestion
        ? `Næste ledige tid er ${fmtDate(suggestion.date)} kl. ${fmtTime(suggestion.start_min)}.`
        : 'Book en ny tid, når det passer dig.',
      label: 'Din tid er aflyst',
      heading: b.service_name,
      b: { ...b, note: undefined },
      cancelled: true,
      intro,
      notice: sick ? undefined : `Årsag: ${reason}`,
      suggestion,
      button: suggestion ? { text: 'Book den tid', href: bookHref } : { text: 'Book en ny tid', href: otherHref },
      secondary: suggestion ? { text: 'Se andre ledige tider', href: otherHref } : undefined,
      contact: true,
      footer: `Du får denne mail, fordi du havde en tid hos ${SALON_NAME}.`,
    }),
  }
}
