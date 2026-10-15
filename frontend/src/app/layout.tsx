import '@styles/tailwind.scss';
import '../../public/fonts/fonts.css';

import { ServiceWorkerRegistration } from '@components/service-worker/service-worker-registration.component';
import AppLayout from '@layouts/app/app-layout.component';
import type { Viewport } from 'next';
import { headers } from 'next/headers';
import { ReactNode, Suspense } from 'react';
import { PWA_THEME_COLOR_DARK, PWA_THEME_COLOR_LIGHT } from 'src/config/pwa-config';

import { localeFromPath } from './locale-path';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: PWA_THEME_COLOR_LIGHT },
    { media: '(prefers-color-scheme: dark)', color: PWA_THEME_COLOR_DARK },
  ],
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  // Rot-layouten ligger ovanför [locale] och har därför ingen locale-parameter. Proxyn
  // sätter x-path på requesten, så språket härleds från sökvägens första segment i
  // stället för att låsas till standardspråket – annars skulle engelska sidor felaktigt
  // deklarera lang="sv" för skärmläsare.
  const locale = localeFromPath((await headers()).get('x-path'));

  return (
    <html lang={locale}>
      <body>
        <Suspense>
          <AppLayout>{children}</AppLayout>
        </Suspense>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
};

export default RootLayout;
