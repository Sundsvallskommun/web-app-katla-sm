# Build context is the repository root: docker build -f frontend/Dockerfile .
ARG NODE_VERSION=22.18.0
ARG YARN_VERSION=1.22.22
FROM node:${NODE_VERSION}-alpine AS builder
ARG YARN_VERSION
RUN test "$(yarn --version)" = "${YARN_VERSION}"
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY katlor/package.json katlor/package.json
RUN yarn install --frozen-lockfile --ignore-scripts
COPY . .

# Public values are embedded for one instance and target environment.
ARG APP_MODE
ARG KATLA_ID
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CATALOGUE_URL
ARG NEXT_PUBLIC_SESSION_COOKIE_NAME
ARG DOMAIN_NAME
ARG NEXT_PUBLIC_BASE_PATH
ARG ADMIN_URL
ARG NEXT_PUBLIC_PROTECTED_ROUTES
ARG NEXT_PUBLIC_INACTIVITY_WARNING_TIMEOUT=1500000
ARG NEXT_PUBLIC_INACTIVITY_COUNTDOWN_TIMEOUT=300000
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn definitions:build && yarn workspace katla-web-app build && yarn standalone:prepare && yarn standalone:check

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
USER nextjs
EXPOSE 3000
CMD ["node", "frontend/server.js"]
