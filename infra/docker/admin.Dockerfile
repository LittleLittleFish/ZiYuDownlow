FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG NPM_FETCH_RETRIES=5
ARG NPM_FETCH_RETRY_MINTIMEOUT=20000
ARG NPM_FETCH_RETRY_MAXTIMEOUT=120000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/admin/package.json apps/admin/package.json
RUN npm config set registry "$NPM_REGISTRY" \
 && npm config set fetch-retries "$NPM_FETCH_RETRIES" \
 && npm config set fetch-retry-mintimeout "$NPM_FETCH_RETRY_MINTIMEOUT" \
 && npm config set fetch-retry-maxtimeout "$NPM_FETCH_RETRY_MAXTIMEOUT" \
 && npm ci --no-audit --no-fund

COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin
RUN npm run build --workspace @ziyu/shared && npm run build --workspace @ziyu/admin

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
