import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const isAuthenticated = request.cookies.get('auth')?.value;

  if (url.pathname.startsWith('/loginmain')) {
    return NextResponse.next();
  }

  if (!isAuthenticated && url.pathname !== '/loginmain') {
    url.pathname = '/loginmain';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};