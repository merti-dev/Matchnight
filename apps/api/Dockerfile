# syntax=docker/dockerfile:1
# Bağlam: repo kökü  →  docker build -f apps/api/Dockerfile .

FROM node:22-bookworm-slim AS build
WORKDIR /app
# better-sqlite3 hazır ikili bulamazsa kaynaktan derlensin diye
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
RUN npm ci -w @matchnight/core -w @matchnight/api
COPY packages/core packages/core
COPY apps/api apps/api
RUN npm run build -w @matchnight/core && npm run build -w @matchnight/api

# Sadece çalışma zamanı bağımlılıkları
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
RUN npm ci --omit=dev -w @matchnight/core -w @matchnight/api

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    MATCHNIGHT_DATA_DIR=/data
RUN useradd --system --uid 1001 --create-home matchnight && mkdir -p /data && chown matchnight /data
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/packages/core/package.json packages/core/
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/apps/api/dist apps/api/dist
# Arşiv tohumu: ilk açılışta ağ yoksa bile site dolu açılsın
COPY data/archive /app/seed/archive
USER matchnight
WORKDIR /app/apps/api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "[ -d /data/archive ] || cp -r /app/seed/archive /data/archive; exec node dist/main.js"]
