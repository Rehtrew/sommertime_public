// The salon's own details: change these to make the app yours.
// Shown to logged-in customers and in their emails.
const address = 'Example Street 12, 1000 Copenhagen'

export const SALON = {
  name: 'Sommertime',
  phone: '12 34 56 78',
  phoneHref: 'tel:+4512345678',
  smsHref: 'sms:+4512345678',
  address,
  mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
}
