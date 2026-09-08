import { localeFromPath, pathWithoutLocale } from '@app/locale-path';

interface LoginRedirectOptions {
  mode: 'katla' | 'catalogue';
  /** Next.js basePath; URL paths returned here include it exactly once. */
  basePath: string;
  pathname: string;
  requestedPath: string | null;
}

/** Only relative paths inside this instance may survive the SAML round trip. */
export const loginRedirectPath = ({ mode, basePath, pathname, requestedPath }: LoginRedirectOptions): string => {
  const withoutBase = (path: string) =>
    basePath && (path === basePath || path.startsWith(`${basePath}/`)) ? path.slice(basePath.length) || '/' : path;
  const locale = localeFromPath(withoutBase(pathname));
  const localePrefix = locale === 'sv' ? '' : `/${locale}`;
  const defaultPath = `${basePath}${localePrefix}/${mode === 'catalogue' ? 'katlor' : 'oversikt'}`;

  for (const candidate of [pathname, requestedPath]) {
    if (!candidate || !/^\/(?!\/)/.test(candidate) || /[\\\u0000-\u0020]|%2f|%5c/i.test(candidate)) continue;
    const url = new URL(candidate, 'https://katla.invalid');
    if (url.origin !== 'https://katla.invalid') continue;
    const instancePath = withoutBase(url.pathname);
    const unprefixedPath = pathWithoutLocale(instancePath);
    if (['/', '/login', '/logout'].includes(unprefixedPath)) continue;
    if (mode === 'catalogue' && unprefixedPath !== '/katlor') continue;
    return `${basePath}${instancePath}${url.search}${url.hash}`;
  }

  return defaultPath;
};
