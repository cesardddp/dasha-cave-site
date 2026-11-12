# syntax=docker/dockerfile:1

# ---- build ------------------------------------------------------------------
FROM oven/bun:1-alpine AS build

WORKDIR /app

ENV NUXT_TELEMETRY_DISABLED=1 \
    NITRO_PRESET=bun

# Camada de dependências: só refaz quando o lockfile muda
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .
RUN bun run build

# ---- runtime ----------------------------------------------------------------
FROM oven/bun:1-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NITRO_PORT=3000 \
    NITRO_HOST=0.0.0.0

# O output do Nitro é autocontido: não é preciso reinstalar dependências
COPY --from=build --chown=bun:bun /app/.output ./.output

USER bun
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", ".output/server/index.mjs"]
