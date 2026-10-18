// Starting point for the service list. Everything can be edited under Admin → Services.
// Prices are in Danish kroner (DKK).
export const SEED_SERVICES: {
  category: string
  name: string
  description: string
  duration: number
  from: number
  to?: number
}[] = [
  {
    category: 'Women',
    name: "Women's cut",
    description: 'A wash with a relaxing scalp massage and a cut that suits you, your hair and your everyday life. Finished with styling.',
    duration: 60,
    from: 739,
    to: 895,
  },
  {
    category: 'Women',
    name: 'Fringe trim',
    description: 'Get your fringe trimmed to perfection. A precise, stylish fringe to refresh your look.',
    duration: 15,
    from: 199,
  },
  {
    category: 'Men',
    name: "Men's cut",
    description: 'A wash with a relaxing scalp massage and a sharp cut that suits you and your style.',
    duration: 30,
    from: 599,
    to: 745,
  },
  {
    category: 'Men',
    name: 'Sides and edges',
    description: 'For sharp sides and clean edges. Can be booked up to 4 weeks after a men’s cut. No wash included.',
    duration: 15,
    from: 479,
    to: 545,
  },
  {
    category: 'Men',
    name: 'Buzz cut, no wash',
    description: 'A clipper cut all over. No wash included.',
    duration: 30,
    from: 479,
  },
  {
    category: 'Colour',
    name: 'Balayage',
    description: 'A natural look with soft transitions and minimal regrowth.',
    duration: 120,
    from: 2459,
    to: 2559,
  },
  {
    category: 'Colour',
    name: 'Balayage refresh',
    description: 'Brings new life to your colour and refreshes the soft transitions.',
    duration: 75,
    from: 1759,
    to: 1859,
  },
  {
    category: 'Colour',
    name: 'Full highlights',
    description: 'Natural movement in the hair and a beautiful blend from root to tip.',
    duration: 120,
    from: 2079,
    to: 2179,
  },
  {
    category: 'Colour',
    name: 'Full highlights with toner',
    description: 'Natural movement and a beautiful blend, finished with a toner for extra shine.',
    duration: 150,
    from: 2528,
    to: 2628,
  },
  {
    category: 'Colour',
    name: 'Partial highlights, top and sides',
    description: 'Refreshes the colour on top and at the sides for a bright, natural look.',
    duration: 90,
    from: 1579,
    to: 1679,
  },
  {
    category: 'Colour',
    name: 'Partial highlights with toner, top and sides',
    description: 'Refreshes the colour on top and at the sides, finished with a toner.',
    duration: 120,
    from: 2028,
    to: 2128,
  },
  {
    category: 'Colour',
    name: 'All-over colour, toner or gloss – short hair',
    description: 'An even, stylish colour throughout the hair with a natural, timeless result.',
    duration: 60,
    from: 999,
    to: 1099,
  },
  {
    category: 'Colour',
    name: 'All-over colour, toner or gloss – medium hair',
    description: 'An even, stylish colour throughout the hair with a natural, timeless result.',
    duration: 75,
    from: 1189,
    to: 1289,
  },
  {
    category: 'Colour',
    name: 'All-over colour, toner or gloss – long hair',
    description: 'An even, stylish colour throughout the hair with a natural, timeless result.',
    duration: 75,
    from: 1289,
    to: 1389,
  },
  {
    category: 'Colour',
    name: 'Root colour',
    description: 'A fresh, even colour at the roots that covers regrowth, so your hair looks cared for.',
    duration: 60,
    from: 899,
  },
  {
    category: 'Colour',
    name: 'Root colour with toner',
    description: 'Covers regrowth and gives a glossier, even and natural result.',
    duration: 75,
    from: 1348,
  },
  {
    category: 'Colour',
    name: 'Root lightening',
    description: 'Lightens the roots for an even, bright look with a harmonious result.',
    duration: 90,
    from: 1525,
  },
]
