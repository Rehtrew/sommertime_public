import { SALON } from './salon'
import { toUtc } from './time'

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
}

/** A calendar file (.ics) with two reminders, so the phone reminds the customer for free. */
export function bookingIcs(
  b: { id: number; date: string; start_min: number; end_min: number; service_name: string },
  salon: string,
  url: string,
) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sommertime//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:booking-${b.id}@sommertime`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(toUtc(b.date, b.start_min))}`,
    `DTEND:${stamp(toUtc(b.date, b.end_min))}`,
    `SUMMARY:${escape(`${b.service_name} · ${salon}`)}`,
    `DESCRIPTION:${escape(`Reschedule or cancel: ${url}`)}`,
    `LOCATION:${escape(`${SALON.name}, ${SALON.address}`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(b.service_name)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(b.service_name)}`,
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
