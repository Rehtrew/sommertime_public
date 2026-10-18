'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

/** The month name doubles as a dropdown, so you can jump months ahead in one go. */
export function MonthPicker({
  value,
  options,
  hrefs,
}: {
  value: string
  options: { value: string; label: string }[]
  hrefs: Record<string, string>
}) {
  const router = useRouter()
  const current = options.find((o) => o.value === value)
  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-full py-1 pr-1 hover:opacity-70">
      <span className="text-[22px] whitespace-nowrap md:text-[28px]">{current?.label}</span>
      <ChevronDown size={20} className="mt-1 shrink-0" />
      <select
        aria-label="Vælg måned"
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
        value={value}
        onChange={(e) => router.push(hrefs[e.target.value], { scroll: false })}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
