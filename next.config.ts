import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // PGlite runs the in-memory demo database when no DATABASE_URL is set.
  serverExternalPackages: ['@electric-sql/pglite'],
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@electric-sql/pglite/dist/*.wasm', './node_modules/@electric-sql/pglite/dist/*.data'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
}

export default nextConfig
