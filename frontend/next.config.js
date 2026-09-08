/* eslint-disable @typescript-eslint/no-require-imports */
const envalid = require('envalid');
const path = require('node:path');
const { getKatlaDefinition } = require('@katla/definitions');
const { definitionRevision } = require('@katla/definitions/server');

const mode = process.env.APP_MODE;
if (mode !== 'katla' && mode !== 'catalogue') throw new Error('APP_MODE must be katla or catalogue. Use yarn katla:build <id|catalogue>.');
if (mode === 'catalogue' && process.env.KATLA_ID) throw new Error('KATLA_ID must be omitted in catalogue mode.');
const allowTestDefinitions = process.env.TEST === 'true';
if (process.env.NEXT_DIST_DIR && !/^\.next(?:-[a-z0-9-]+)?$/.test(process.env.NEXT_DIST_DIR)) {
  throw new Error('NEXT_DIST_DIR must be .next or a local .next-<name> directory.');
}
const definition = mode === 'katla'
  ? getKatlaDefinition(process.env.KATLA_ID || '', { allowTestDefinitions })
  : undefined;
if (process.env.NEXT_PUBLIC_CATALOGUE_URL) {
  const catalogueUrl = new URL(process.env.NEXT_PUBLIC_CATALOGUE_URL);
  if (!['http:', 'https:'].includes(catalogueUrl.protocol) || catalogueUrl.username || catalogueUrl.password || catalogueUrl.search || catalogueUrl.hash) {
    throw new Error('NEXT_PUBLIC_CATALOGUE_URL must be an absolute HTTP(S) URL without credentials, query or fragment.');
  }
}

const authDependent = envalid.makeValidator((x) => {
  const authEnabled = process.env.HEALTH_AUTH === 'true';

  if (authEnabled && !x.length) {
    throw new Error(`Can't be empty if "HEALTH_AUTH" is true`);
  }

  return x;
});

envalid.cleanEnv(process.env, {
  NEXT_PUBLIC_API_URL: envalid.str(),
  HEALTH_AUTH: envalid.bool({ default: false }),
  HEALTH_USERNAME: authDependent({ default: '' }),
  HEALTH_PASSWORD: authDependent({ default: '' }),
});

module.exports = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  env: {
    NEXT_PUBLIC_APP_MODE: mode,
    NEXT_PUBLIC_KATLA_ID: definition?.id || '',
    NEXT_PUBLIC_DEFINITION_REVISION: definition ? definitionRevision(definition) : '',
    NEXT_PUBLIC_ALLOW_TEST_DEFINITIONS: String(allowTestDefinitions),
  },
  // Automatic tracing omits libvips shared libraries needed by standalone image optimization.
  outputFileTracingIncludes: {
    '/*': [
      '../node_modules/@img/sharp-libvips-*/lib/**/*',
      './node_modules/@img/sharp-libvips-*/lib/**/*',
      '../node_modules/next/node_modules/@img/sharp-libvips-*/lib/**/*',
      './node_modules/next/node_modules/@img/sharp-libvips-*/lib/**/*',
      '../katlor/dist/**/*',
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  allowedDevOrigins: ['dev.test'],
  images: {
    remotePatterns: process.env.DOMAIN_NAME ? [{ protocol: 'https', hostname: process.env.DOMAIN_NAME }] : [],
    formats: ['image/avif', 'image/webp'],
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  experimental: {
    optimizePackageImports: ['lodash', 'dayjs'],
  },
  async rewrites() {
    return [{ source: '/napi/:path*', destination: '/api/:path*' }];
  },
};
