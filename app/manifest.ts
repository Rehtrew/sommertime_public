import type { MetadataRoute } from 'next'
import { SALON } from '@/lib/salon'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SALON.name,
    short_name: SALON.name,
    description: 'Book your next appointment',
    start_url: '/home',
    display: 'standalone',
    background_color: '#ededed',
    theme_color: '#ededed',
    icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }],
  }
}
