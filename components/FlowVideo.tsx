'use client'

import { useEffect, useRef } from 'react'

export function FlowVideo({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause()
  }, [])

  return (
    <video
      ref={ref}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/flow-poster.jpg"
      aria-hidden
    >
      <source src="/flow.webm" type="video/webm" />
      <source src="/flow.mp4" type="video/mp4" />
    </video>
  )
}
