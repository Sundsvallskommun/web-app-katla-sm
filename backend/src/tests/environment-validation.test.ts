import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

import validateEnv from '@utils/validateEnv';
import { parse } from 'dotenv';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const expectStartupRejection = () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('Environment validation stopped startup');
  });
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

  expect(validateEnv).toThrow('Environment validation stopped startup');
  expect(exit).toHaveBeenCalledWith(1);
};

describe('session secret startup validation', () => {
  it.each([
    { scenario: 'missing', secret: undefined },
    { scenario: 'empty', secret: '' },
    { scenario: 'whitespace-only', secret: ' '.repeat(64) },
    { scenario: 'short even when randomly generated', secret: randomBytes(15).toString('hex') },
    { scenario: 'a long placeholder', secret: '<replace-with-a-unique-session-secret>' },
    { scenario: 'a repeated placeholder', secret: 'change-me'.repeat(4) },
    { scenario: 'padded with whitespace', secret: ` ${randomBytes(32).toString('hex')}` },
  ])('prevents startup when SECRET_KEY is $scenario', ({ secret }) => {
    vi.stubEnv('SECRET_KEY', secret);

    expectStartupRejection();
  });

  it('requires the copied environment template to receive its own session secret', () => {
    const template = parse(readFileSync('.env.example.local'));
    vi.stubEnv('SECRET_KEY', template.SECRET_KEY);

    expectStartupRejection();
  });

  it.each(['development', 'test', 'production'])('accepts a generated secret in %s', environment => {
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('SECRET_KEY', randomBytes(32).toString('hex'));

    expect(validateEnv).not.toThrow();
  });
});
