import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = 'league_access';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Development: bypass all checks when BYPASS_AUTH is set
  if (process.env.BYPASS_AUTH === 'true') {
    return NextResponse.next();
  }

  // Public routes that don't need password protection
  const publicRoutes = ['/gate', '/api/gate/verify'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Skip auth for Yahoo OAuth routes (needed for admin data import)
  if (pathname.startsWith('/api/auth/yahoo')) {
    return NextResponse.next();
  }

  // Check for access cookie
  const accessCookie = request.cookies.get(COOKIE_NAME);
  const hasAccess = accessCookie?.value === 'granted';

  // If no access and not on public route, redirect to gate
  if (!hasAccess && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/gate';
    // Preserve the original URL as a redirect parameter
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If has access and trying to access gate, redirect to intended destination or home
  if (hasAccess && pathname === '/gate') {
    const url = request.nextUrl.clone();
    const redirect = request.nextUrl.searchParams.get('redirect') || '/';
    url.pathname = redirect;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
