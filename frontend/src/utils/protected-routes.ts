import { pathWithoutLocale } from '@app/locale-path';

interface ProtectedPathOptions {
  basePath?: string;
  additionalRoutes?: string[];
}

/** App routes stay protected even when an instance omits the optional extra route list. */
export const isProtectedPath = (
  pathname: string,
  { basePath = '', additionalRoutes = [] }: ProtectedPathOptions = {}
): boolean => {
  const path =
    basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`)) ?
      pathname.slice(basePath.length) || '/'
    : pathname;
  const unprefixedPath = pathWithoutLocale(path);
  return ['/katlor', '/oversikt', '/arende', ...additionalRoutes.filter(Boolean)].some(
    (route) => unprefixedPath === route || unprefixedPath.startsWith(`${route}/`)
  );
};
