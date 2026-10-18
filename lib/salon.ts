// The salon's own details: change these to make the app yours.
// Shown to logged-in customers and in their emails.
const address = 'Eksempelvej 12, 1000 København'

export const SALON = {
  name: 'Studio Saks',
  phone: '12 34 56 78',
  phoneHref: 'tel:+4512345678',
  smsHref: 'sms:+4512345678',
  address,
  mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
}
