import fs from 'node:fs';
import path from 'node:path';

import manifest from '@app/manifest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const publicDir = path.join(process.cwd(), 'public');

describe('Web app manifest', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefixes start_url, scope and icons with the base path', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/vof');

    const result = manifest();

    expect(result.id).toBe('/vof/');
    expect(result.scope).toBe('/vof/');
    expect(result.start_url).toBe('/vof/oversikt');
    expect(result.icons?.map((icon) => icon.src)).toEqual([
      '/vof/icons/icon-192.png',
      '/vof/icons/icon-512.png',
      '/vof/icons/icon-maskable-512.png',
    ]);
  });

  it('uses root paths without a base path', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');

    const result = manifest();

    expect(result.scope).toBe('/');
    expect(result.start_url).toBe('/oversikt');
  });

  it('keeps start_url inside the scope so the installed app does not open it as an external page', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/vof');

    const { scope, start_url } = manifest();

    expect(start_url?.startsWith(scope ?? '')).toBe(true);
  });

  it('meets the install requirements for name, display and icon sizes', () => {
    const result = manifest();

    expect(result.name).toBeTruthy();
    expect(result.short_name).toBeTruthy();
    expect(result.display).toBe('standalone');
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      ])
    );
  });

  it('points every icon at a file in public', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');

    for (const icon of manifest().icons ?? []) {
      expect(fs.existsSync(path.join(publicDir, icon.src)), `${icon.src} saknas i public`).toBe(true);
    }
  });
});
