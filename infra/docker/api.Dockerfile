FROM node:20-alpine AS builder
WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG NPM_FETCH_RETRIES=5
ARG NPM_FETCH_RETRY_MINTIMEOUT=20000
ARG NPM_FETCH_RETRY_MAXTIMEOUT=120000

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/api/package.json services/api/package.json
RUN npm config set registry "$NPM_REGISTRY" \
 && npm config set fetch-retries "$NPM_FETCH_RETRIES" \
 && npm config set fetch-retry-mintimeout "$NPM_FETCH_RETRY_MINTIMEOUT" \
 && npm config set fetch-retry-maxtimeout "$NPM_FETCH_RETRY_MAXTIMEOUT" \
 && npm ci --no-audit --no-fund

COPY packages/shared ./packages/shared
COPY services/api ./services/api
RUN npm run build --workspace @ziyu/shared && npm run build --workspace @ziyu/api

FROM node:20-alpine AS runner
WORKDIR /app/services/api
ENV NODE_ENV=production

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/packages/shared /app/packages/shared
COPY --from=builder /app/services/api/package.json ./package.json
COPY --from=builder /app/services/api/dist ./dist

EXPOSE 4000
CMD ["node", "dist/services/api/src/server.js"]
