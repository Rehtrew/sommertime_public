import { initials } from '@/lib/format'

export function Avatar({
  name,
  src,
  size = 44,
  className = '',
}: {
  name: string
  src?: string | null
  size?: number
  className?: string
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) }
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={style} className={`shrink-0 rounded-full object-cover ${className}`} />
  }
  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-lilac text-ink ${className}`}
      aria-hidden
    >
      {initials(name) || '?'}
    </span>
  )
}
