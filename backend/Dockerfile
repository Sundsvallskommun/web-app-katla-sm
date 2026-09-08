# One reusable backend image per code release. Select APP_MODE/KATLA_ID at runtime.
# Build context: repository root, docker build -f backend/Dockerfile .
ARG NODE_VERSION=22.18.0
ARG YARN_VERSION=1.22.22
FROM node:${NODE_VERSION}-slim AS build-base
ARG YARN_VERSION
RUN test "$(yarn --version)" = "${YARN_VERSION}"
WORKDIR /app

FROM build-base AS builder
COPY package.json yarn.lock ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY katlor/package.json katlor/package.json
RUN yarn install --frozen-lockfile --ignore-scripts
COPY . .
RUN yarn definitions:build && yarn workspace backend build
RUN node scripts/backend-artifact.mjs /artifact

FROM build-base AS runtime-dependencies
COPY --from=builder /artifact/ ./
RUN yarn install --frozen-lockfile --production --ignore-scripts

FROM node:${NODE_VERSION}-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs
COPY --from=runtime-dependencies --chown=nodejs:nodejs /app/ ./
USER nodejs
EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
