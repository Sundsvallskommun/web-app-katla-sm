import { isProtectedPath } from '@utils/protected-routes';
import { describe, expect, it } from 'vitest';

describe('protected application routes', () => {
  it.each(['/katlor', '/oversikt', '/arende/registrera', '/arende/123/meddelanden'])(
    'protects %s and its language variants without environmental configuration',
    (path) => {
      expect(isProtectedPath(path)).toBe(true);
      expect(isProtectedPath(`/en${path}`)).toBe(true);
      expect(isProtectedPath(`/katla/en${path}`, { basePath: '/katla' })).toBe(true);
    }
  );

  it.each(['/', '/login', '/logout', '/en/login', '/katlornas-historia', '/oversikt-annat'])(
    'keeps public route %s outside the authentication loop',
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    }
  );

  it('extends the canonical routes without losing catalogue protection', () => {
    expect(isProtectedPath('/en/internal/detail', { additionalRoutes: ['/internal'] })).toBe(true);
    expect(isProtectedPath('/katlor', { additionalRoutes: ['/internal'] })).toBe(true);
  });
});
