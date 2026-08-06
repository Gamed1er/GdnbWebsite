import NextAuth from 'next-auth';
import authConfig from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth(function proxy(req) {
  const isLoggedIn = !!req.auth;
  const isLoginPath = req.nextUrl.pathname === '/admin/login';

  if (!isLoginPath && !isLoggedIn) {
    const url = new URL('/admin/login', req.url);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
