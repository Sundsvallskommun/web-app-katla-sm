import { loginRedirectPath } from '@components/auth/login-redirect';
import { describe, expect, it } from 'vitest';

describe('SAML login destination', () => {
  it('opens the catalogue or the selected Katla after login', () => {
    const options = { basePath: '', pathname: '/login', requestedPath: null };
    expect(loginRedirectPath({ ...options, mode: 'catalogue' })).toBe('/katlor');
    expect(loginRedirectPath({ ...options, mode: 'katla' })).toBe('/oversikt');
  });

  it('preserves a direct errand link, language, query and the instance prefix exactly once', () => {
    const options = { mode: 'katla' as const, basePath: '/katla', pathname: '/en/login' };
    expect(loginRedirectPath({ ...options, requestedPath: '/katla/en/arende/123/grundinformation?tab=1' })).toBe(
      '/katla/en/arende/123/grundinformation?tab=1'
    );
    expect(loginRedirectPath({ ...options, requestedPath: '/en/arende/123/grundinformation' })).toBe(
      '/katla/en/arende/123/grundinformation'
    );
  });

  it.each([
    'https://other.example/path',
    '//other.example',
    '/\\other.example',
    '/%2fother.example',
    '/logout',
    '/en/login',
    '/',
  ])('rejects an unsafe or looping destination: %s', (requestedPath) => {
    expect(loginRedirectPath({ mode: 'katla', basePath: '', pathname: '/login', requestedPath })).toBe('/oversikt');
  });

  it('keeps a catalogue login inside the catalogue and preserves English', () => {
    expect(
      loginRedirectPath({ mode: 'catalogue', basePath: '/portal', pathname: '/en/login', requestedPath: '/arende/123' })
    ).toBe('/portal/en/katlor');
  });
});
