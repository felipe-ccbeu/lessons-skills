import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Optimistic check only: confirms a session cookie exists, nothing about role.
// Role checks happen per-request in the DAL (src/lib/dal.ts), inside each
// Server Component / Route Handler / Server Action — see the Next.js auth
// guide's warning that Proxy must not be the only line of defense.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith('/lessons') || pathname.startsWith('/admin') || pathname.startsWith('/aguardando');
  const isLoginPage = pathname === '/login';

  if (isProtected && !isLoggedIn) {
    const url = new URL('/login', req.nextUrl);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/lessons', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/lessons/:path*', '/admin/:path*', '/aguardando', '/login'],
};
