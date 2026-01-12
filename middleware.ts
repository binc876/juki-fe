import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Hanya log request yang mengarah ke API Proxy
  if (request.nextUrl.pathname.startsWith('/api/proxy')) {
    console.log(`[API-HIT] ${request.method} ${request.nextUrl.pathname}`)
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/proxy/:path*',
}
