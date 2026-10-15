'use client';

import { withBasePath } from '@utils/base-path';
import { useEffect } from 'react';

/**
 * Registrerar service workern som visar en offlinesida när nätet saknas. Bara i
 * produktionsbyggen: i dev skulle en registrerad worker ligga kvar mellan omstarter och
 * blanda sig i omladdningen av ändrad kod.
 */
export const ServiceWorkerRegistration: React.FC = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register(withBasePath('/sw.js'), { scope: withBasePath('/') }).catch((error: unknown) => {
      console.error('Service workern kunde inte registreras', error);
    });
  }, []);

  return null;
};
