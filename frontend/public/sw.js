// Service worker för Katla. Den gör en enda sak: visar en offlinesida när en sidladdning
// misslyckas för att nätet saknas.
//
// Sidor och API-svar cachas medvetet inte. De renderas per användare och innehåller
// personuppgifter som annars skulle ligga kvar i webbläsaren efter utloggning. Statiska
// resurser under _next/static får redan långlivade cacheheaders av Next, så en egen cache
// för dem skulle bara riskera inaktuella filer efter en deploy.
//
// Höj CACHE_VERSION när offline.html ändras. Webbläsaren installerar bara om workern när
// den här filen ändras, och annars ligger den gamla offlinesidan kvar i cachen.
const CACHE_VERSION = 1;
const CACHE_PREFIX = 'katla-offline-';
const OFFLINE_CACHE = `${CACHE_PREFIX}v${CACHE_VERSION}`;

// Workern registreras med appens bassökväg som scope. Offlinesidans adress härleds därifrån
// så att bassökvägen inte behöver byggas in i filen.
const OFFLINE_URL = new URL('offline.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Rensa bara egna, äldre cachar. Andra appar på samma domän kan ha egna.
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== OFFLINE_CACHE)
          .map((name) => caches.delete(name))
      );

      // Låter sidladdningen starta parallellt med att workern vaknar, så att workern inte
      // gör navigeringen långsammare.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })()
  );
});

const fetchPageOrOfflineFallback = async (event) => {
  try {
    const preloadResponse = await event.preloadResponse;
    return preloadResponse ?? (await fetch(event.request));
  } catch {
    return (await caches.match(OFFLINE_URL)) ?? Response.error();
  }
};

self.addEventListener('fetch', (event) => {
  // Bara vanliga sidladdningar. Formulärpostningar, till exempel SAML-svaret från
  // inloggningen, och alla övriga anrop går direkt till nätet utan att workern rör dem.
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(fetchPageOrOfflineFallback(event));
});
