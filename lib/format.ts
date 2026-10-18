const nf = new Intl.NumberFormat('en-GB')

/** Prices are in Danish kroner: "DKK 739" */
export function kr(n: number) {
  return `DKK ${nf.format(n)}`
}

export function priceRange(from: number, to: number | null | undefined) {
  return to && to !== from ? `DKK ${nf.format(from)}–${nf.format(to)}` : kr(from)
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
}

const CATEGORY_COLORS: Record<string, string> = {
  Women: '#8b6cf0',
  Men: '#3f6fe0',
  Colour: '#ff8a1f',
}

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? '#b9b2f0'
}

/** Sentence case: upper-cases the first letter. */
export function cap(s: string) {
  return s.charAt(0).toLocaleUpperCase('en-GB') + s.slice(1)
}
