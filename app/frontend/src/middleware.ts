import NextAuth from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { authConfig } from '@/auth.config';

const { auth } = NextAuth(authConfig);

async function middleware(request: NextRequest) {
  const MODULE_NAME = "MIDDLEWARE"
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const sensitiveRoutes = ['/dashboard', '/protected']
  const isAccessingSensitiveRoute = sensitiveRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )
  const pathname = request.nextUrl.pathname
  const isAuthenticated = !!request.auth;

  logger.info(MODULE_NAME, 'Middleware processing request', {
    pathname,
    isAuthPage,
    method: request.method,
    url: request.url
  })

  // Handle root path
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    } 
  }

  if (isAccessingSensitiveRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Handle auth pages (login)
  if (isAuthPage && isAuthenticated) {
    logger.info(MODULE_NAME, 'Authenticated user accessing auth page, redirecting to dashboard', {
      pathname
    })
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

export default auth((req) => middleware(req))

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/settings/:path*', '/profile/:path*']
}
 