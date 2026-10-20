'use client'

import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Avatar } from './Avatar'

const SIZE = 320

/** Picks an image, crops it to a square and shrinks it before it is sent to the server. */
export function AvatarInput({ name, initial }: { name: string; initial: string | null }) {
  const [src, setSrc] = useState(initial)
  const [value, setValue] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        SIZE,
        SIZE,
      )
      const data = canvas.toDataURL('image/jpeg', 0.82)
      setSrc(data)
      setValue(data)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative rounded-full"
        aria-label="Choose profile photo"
      >
        <Avatar name={name} src={src} size={96} />
        <span className="absolute -right-1 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">
          <Camera size={18} />
        </span>
      </button>
      <div className="flex flex-col items-start gap-1">
        <button type="button" className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()}>
          {src ? 'Change photo' : 'Add photo'}
        </button>
        {src && (
          <button
            type="button"
            className="px-2 py-1 text-small text-muted"
            onClick={() => {
              setSrc(null)
              setValue('remove')
            }}
          >
            Remove photo
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <input type="hidden" name="avatar" value={value} />
    </div>
  )
}
