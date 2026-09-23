# syntax=docker/dockerfile:1
# Bağlam: repo kökü  →  docker build -f apps/web/Dockerfile .

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY apps/web/package.json apps/web/
RUN npm ci -w @matchnight/core -w @matchnight/web
COPY packages/core packages/core
COPY apps/web apps/web
RUN npm run build -w @matchnight/core && npm run build -w @matchnight/web

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN useradd --system --uid 1001 matchnight
# Next'in standalone çıktısı: server.js + izlenen node_modules (monorepo düzeninde)
COPY --from=build --chown=matchnight /app/apps/web/.next/standalone ./
COPY --from=build --chown=matchnight /app/apps/web/.next/static ./apps/web/.next/static
USER matchnight
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
