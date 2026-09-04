import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App, { getSessionCookieOptions, getSessionCookiePath } from '@/app';
import { IndexController } from '@/controllers/index.controller';
import { localApi } from '@/utils/util';

describe('security middleware', () => {
  it('uses secure session cookies in production', () => {
    expect(getSessionCookieOptions('production')).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    expect(getSessionCookieOptions('test').secure).toBe(false);
  });

  it('lets ENVIRONMENT=LOCAL turn off the secure flag for local http builds', () => {
    expect(getSessionCookieOptions('production', 'LOCAL').secure).toBe(false);
    // Allt annat än LOCAL ska behålla Secure — särskilt tomt/osatt, som är produktionsfallet.
    expect(getSessionCookieOptions('production', 'TEST').secure).toBe(true);
    expect(getSessionCookieOptions('production', '').secure).toBe(true);
    expect(getSessionCookieOptions('production', undefined).secure).toBe(true);
    // LOCAL får inte slå på Secure i en icke-produktionsmiljö.
    expect(getSessionCookieOptions('development', 'LOCAL').secure).toBe(false);
  });

  it('sets hardened attributes on a persisted session cookie', async () => {
    const app = new App([IndexController]).getServer();
    app.get('/api/session-test', (req, res) => {
      req.session.returnTo = '/';
      res.sendStatus(204);
    });

    const response = await request(app).get('/api/session-test').expect(204);
    const cookies = response.headers['set-cookie'];
    if (!Array.isArray(cookies)) {
      throw new Error('Expected one persisted session cookie');
    }
    if (typeof cookies[0] !== 'string') {
      throw new Error('Expected one persisted session cookie');
    }
    const cookie = cookies[0];

    expect(cookies).toHaveLength(1);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    // Kakans path ägs av getSessionCookiePath och måste täcka hela appen, inte bara
    // API-prefixet: Next-middlewaren läser kakan på UI-vägar, och en kaka begränsad
    // till /api skickas aldrig dit (RFC 6265 §5.1.4). Assertionen låser att
    // sessionsmiddlewaren faktiskt använder helpern, så en återgång till ett hårdkodat
    // prefix syns här i stället för som en inloggningsloop.
    expect(cookie).toContain(`Path=${getSessionCookiePath()}`);
    expect(getSessionCookiePath().startsWith('/api')).toBe(false);
  });

  // En cross-site POST från IdP:n (SAML-callbacken) bär en Origin-header som aldrig ligger i
  // ORIGIN-vitlistan. CORS ska då bara utelämna Access-Control-Allow-Origin — inte avvisa
  // requesten. Kastar vi i stället ett fel blir det 500 "Not allowed by CORS" och inloggningen
  // går aldrig igenom (draken/MEX fungerar just för att dess cors aldrig kastar).
  it('does not reject requests from a non-whitelisted origin', async () => {
    const app = new App([IndexController]).getServer();

    const response = await request(app).get(localApi('/')).set('Origin', 'https://idp.example.com');

    expect(response.status).not.toBe(500);
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('reflects the allow-origin header for a whitelisted origin', async () => {
    const app = new App([IndexController]).getServer();

    const response = await request(app).get(localApi('/')).set('Origin', 'http://localhost:3000').expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('publishes standard rate-limit headers without legacy headers', async () => {
    const app = new App([IndexController]);
    const response = await request(app.getServer()).get(localApi('/')).expect(200);

    expect(response.headers['ratelimit-policy']).toContain('1000;w=900');
    expect(response.headers['ratelimit-limit']).toBe('1000');
    expect(response.headers['x-ratelimit-limit']).toBeUndefined();
  });

  describe('production session cookies', () => {
    beforeEach(() => {
      // Konfigurationen läses vid import. Ladda därför om den riktiga appen med
      // produktionsvärden i stället för att ersätta sessionsmiddlewaren med en mock.
      vi.resetModules();
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ENVIRONMENT', '');
      // En egen riktig Passport-instans hindrar App-importerna från att samla
      // serialiserare och SAML-strategier i paketets globala instans mellan tester.
      vi.doMock('passport', async () => {
        const { Passport } = await vi.importActual<typeof import('passport')>('passport');
        return { default: new Passport() };
      });
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      vi.doUnmock('passport');
      vi.resetModules();
    });

    const createSessionTestServer = async () => {
      const { default: ProductionApp } = await import('@/app');
      const app = new ProductionApp([]).getServer();
      app.get('/api/session-test', (req, res) => {
        req.session.returnTo = '/';
        res.sendStatus(204);
      });
      return app;
    };

    it('issues a Secure cookie behind the trusted HTTPS proxy', async () => {
      const app = await createSessionTestServer();
      const response = await request(app).get('/api/session-test').set('X-Forwarded-Proto', 'https').expect(204);

      expect(response.headers['set-cookie']).toEqual([expect.stringContaining('; Secure')]);
    });

    it('does not issue a production session cookie over plain HTTP', async () => {
      const app = await createSessionTestServer();
      const response = await request(app).get('/api/session-test').expect(204);

      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('allows the documented LOCAL exception for a production build over HTTP', async () => {
      vi.stubEnv('ENVIRONMENT', 'LOCAL');
      const app = await createSessionTestServer();
      const response = await request(app).get('/api/session-test').expect(204);

      expect(response.headers['set-cookie']).toEqual([expect.not.stringContaining('; Secure')]);
    });
  });
});
