FROM node:26.13.1-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 PRISMA_DISABLE_TELEMETRY=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --prefer-offline
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY prisma ./prisma
COPY tests ./tests
COPY biome.json next.config.ts prisma.config.ts postcss.config.json tsconfig.json ./
RUN npm run db:generate

FROM build AS db-setup
RUN chown node:node /app
USER node
CMD ["sh", "-c", "npm exec -- prisma db init && exec node prisma/migrate.ts"]

FROM build AS web-build
RUN npm run build && npm run typecheck

FROM node:26.13.1-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PRISMA_DISABLE_TELEMETRY=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=web-build --chown=node:node /app/.next/standalone ./
COPY --from=web-build --chown=node:node /app/.next/static ./.next/static
COPY --chown=node:node lib/postgres-url.ts ./lib/postgres-url.ts
COPY --chown=node:node tests ./tests
USER node
EXPOSE 3000
CMD ["node", "server.js"]
