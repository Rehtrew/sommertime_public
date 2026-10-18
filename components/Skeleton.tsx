/** Placeholder shown instantly while a page is fetched from the server. */
export function Skeleton({ admin = false }: { admin?: boolean }) {
  const block = 'rounded-[28px] bg-card/70 motion-safe:animate-pulse'
  return (
    <div aria-busy="true" aria-label="Loading" className={admin ? '' : 'pt-4'}>
      <div className={`mx-2 mt-4 mb-6 h-12 w-56 rounded-[16px] bg-card/70 motion-safe:animate-pulse md:h-16 md:w-80 ${admin ? 'md:mt-2' : ''}`} />
      <div className="flex flex-col gap-3">
        <div className={`${block} h-64`} />
        <div className={`${block} h-40`} />
      </div>
    </div>
  )
}
