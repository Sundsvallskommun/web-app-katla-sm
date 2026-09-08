// Local E2E identity service. No production login bypass or external system is used.
import { createServer } from 'node:http';
import { getKatlaDefinition } from '@katla/definitions';
import { definitionRevision } from '@katla/definitions/server';

const port = Number(process.env.E2E_API_PORT || 3001);
const frontendOrigin = process.env.E2E_FRONTEND_ORIGIN || 'http://localhost:3000';
const mode = process.env.APP_MODE || 'katla';
if (!['katla', 'catalogue'].includes(mode)) throw new Error('E2E APP_MODE must be katla or catalogue.');
const definition =
  mode === 'katla' ?
    getKatlaDefinition(process.env.KATLA_ID || 'avvikelse-test', { allowTestDefinitions: true })
  : undefined;
const context =
  definition ? { mode, katlaId: definition.id, definitionRevision: definitionRevision(definition) } : { mode };
const cookieName = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || `katla.${definition?.id || 'catalogue'}.sid`;
const applications = [
  {
    id: 'avvikelse',
    applicationName: 'Avvikelse',
    description: 'Rapportera en avvikelse',
    url: 'https://avvikelse.example.invalid',
  },
  {
    id: 'schema-test',
    applicationName: 'Testbeställning',
    description: 'Beställ utrustning',
    url: 'https://bestallning.example.invalid',
  },
];

const server = createServer((request, response) => {
  if (request.headers.origin === frontendOrigin) {
    response.setHeader('Access-Control-Allow-Origin', frontendOrigin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  const reply = (status, data, message = 'success') => {
    response.writeHead(status);
    response.end(JSON.stringify({ data, message }));
  };
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method !== 'GET') return reply(405, null, 'E2E_READ_ONLY');
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  if (pathname === '/api/health') return reply(200, { mode });
  if (pathname === '/api/app-context') return reply(200, context);

  const cookie = request.headers.cookie
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${cookieName}=`));
  const identity = cookie?.slice(cookieName.length + 1);
  if (!['fixture-none', 'fixture-one', 'fixture-many'].includes(identity)) return reply(401, null, 'NOT_AUTHORIZED');
  if (pathname === '/api/me')
    return reply(200, { name: 'Testanvändare Katla', username: 'katla-test', initials: 'TK' });
  if (pathname === '/api/applications' && mode === 'catalogue') {
    const applicationCount = { 'fixture-none': 0, 'fixture-one': 1, 'fixture-many': 2 }[identity];
    return reply(200, applications.slice(0, applicationCount));
  }
  return reply(404, null, 'E2E_ROUTE_NOT_IMPLEMENTED');
});

server.listen(port, 'localhost', () => {
  console.log(`Local ${mode} E2E identity service: http://localhost:${port}/api`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
