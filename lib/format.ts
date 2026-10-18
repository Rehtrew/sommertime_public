const nf = new Intl.NumberFormat('da-DK')

export function kr(n: number) {
  return `${nf.format(n)} kr.`
}

export function priceRange(from: number, to: number | null | undefined) {
  return to && to !== from ? `${nf.format(from)}–${nf.format(to)} kr.` : kr(from)
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
  Dame: '#ff3f8e',
  Herre: '#3f6fe0',
  Farve: '#ff8a1f',
}

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? '#b9b2f0'
}

/** Sentence case for text that starts with a weekday, e.g. "tirsdag" → "Tirsdag". */
export function cap(s: string) {
  return s.charAt(0).toLocaleUpperCase('da-DK') + s.slice(1)
}
