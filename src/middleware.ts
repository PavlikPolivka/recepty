import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['cs', 'en'],

  // Used when no locale matches
  defaultLocale: 'cs'
});

export const config = {
  // Match only internationalized pathnames, exclude auth routes
  matcher: ['/', '/(cs|en)/:path*', '/((?!api|_next|_vercel|auth|.*\\..*).*)']
};
