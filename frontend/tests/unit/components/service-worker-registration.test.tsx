import { ServiceWorkerRegistration } from '@components/service-worker/service-worker-registration.component';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const register = vi.fn<ServiceWorkerContainer['register']>();

describe('ServiceWorkerRegistration', () => {
  beforeEach(() => {
    register.mockReset();
    register.mockResolvedValue({} as ServiceWorkerRegistration);
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('registers the worker under the base path in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/vof');

    render(<ServiceWorkerRegistration />);

    expect(register).toHaveBeenCalledExactlyOnceWith('/vof/sw.js', { scope: '/vof/' });
  });

  it('does not register the worker outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    render(<ServiceWorkerRegistration />);

    expect(register).not.toHaveBeenCalled();
  });

  it('does nothing in browsers without service worker support', () => {
    vi.stubEnv('NODE_ENV', 'production');
    Reflect.deleteProperty(navigator, 'serviceWorker');

    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });

  it('logs a failed registration instead of throwing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const error = new Error('SecurityError');
    register.mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<ServiceWorkerRegistration />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Service workern kunde inte registreras', error);
    });
  });
});
