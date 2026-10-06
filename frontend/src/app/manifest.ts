import { withBasePath } from '@utils/base-path';
import type { MetadataRoute } from 'next';
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR_LIGHT } from 'src/config/pwa-config';

const manifest = (): MetadataRoute.Manifest => {
  const appName = (process.env.NEXT_PUBLIC_APP_NAME ?? '') || 'Katla';

  return {
    // id och scope bär bassökvägen så att flera installationer på samma domän hålls isär.
    id: withBasePath('/'),
    name: appName,
    short_name: appName,
    description: 'Ärendehantering för Sundsvalls kommun',
    lang: 'sv',
    // Rotsidan omdirigerar ändå till översikten. Med bassökväg skulle den dessutom hamna på
    // '/vof', som ligger utanför scopet '/vof/' och öppnas som extern sida i den installerade appen.
    start_url: withBasePath('/oversikt'),
    scope: withBasePath('/'),
    display: 'standalone',
    // Manifestet tar bara en färg. Sidans theme-color, som följer färgschemat, tar över när den laddats.
    theme_color: PWA_THEME_COLOR_LIGHT,
    background_color: PWA_BACKGROUND_COLOR,
    icons: [
      { src: withBasePath('/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: withBasePath('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: withBasePath('/icons/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
};

export default manifest;
