import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAuthPage = ['/signin', '/signup'].includes(request.nextUrl.pathname)

  // Admin routes require auth
  if (isAdminRoute) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/signin'
      return NextResponse.redirect(url)
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const adminRoles = ['admin', 'service_role', 'super_admin']
      if (!payload.role || !adminRoles.includes(payload.role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        const url = request.nextUrl.clone()
        url.pathname = '/signin'
        return NextResponse.redirect(url)
      }
    } catch {
      const url = request.nextUrl.clone()
      url.pathname = '/signin'
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        const adminRoles = ['admin', 'service_role', 'super_admin']
        const url = request.nextUrl.clone()
        url.pathname = adminRoles.includes(payload.role) ? '/admin/overview' : '/'
        return NextResponse.redirect(url)
      }
    } catch {
      // Invalid token, let them access auth pages
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|auth/callback|template-test).*)',
  ],
}
