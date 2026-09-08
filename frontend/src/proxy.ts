import i18nConfig from '@app/i18nConfig';
import { pathWithoutLocale } from '@app/locale-path';
import { isProtectedPath } from '@utils/protected-routes';
import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';

export async function proxy(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;
  // Skyddade rutter och admin-omdirigeringen listas utan språkprefix. Jämför därför mot
  // den språkskalade sökvägen – annars slutar /en/... matcha listan och kontrollen hoppas
  // över helt på andra språk än standardspråket.
  const unprefixedPathname = pathWithoutLocale(pathname);

  if (unprefixedPathname === '/admin') {
    const adminUrl = process.env.ADMIN_URL;
    if (!adminUrl) return new NextResponse(null, { status: 404 });
    return NextResponse.redirect(new URL(adminUrl));
  }

  if (isProtectedPath(pathname, { additionalRoutes: (process.env.NEXT_PUBLIC_PROTECTED_ROUTES ?? '').split(',') })) {
    const cookieName = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? '';
    const token = req.cookies.get(cookieName)?.value ?? '';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
      cache: 'no-cache',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: `${cookieName}=${encodeURIComponent(token)}`,
      },
    }).catch(() => null);

    if (!response?.ok) {
      const loginUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`, origin);
      loginUrl.searchParams.set('path', `${pathname}${req.nextUrl.search}`);
      if (response?.status !== 401) {
        loginUrl.searchParams.set(
          'failMessage',
          response?.status === 403 ? 'MISSING_PERMISSIONS' : 'ACCESS_POLICY_UNAVAILABLE'
        );
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  req.headers.set('x-path', pathname);
  return i18nRouter(req, i18nConfig);
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
};
