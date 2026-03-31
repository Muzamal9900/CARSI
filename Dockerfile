# DigitalOcean App Platform: use `app.yaml` (app spec) with `dockerfile_path: Dockerfile` — not `project.yml` (that name is for DO Functions).
# Otherwise App Platform auto-detects TypeScript and uses unsupported runtime `typescript:default`.

# Prisma 7 + @prisma/* packages expect Node >= 22 for some tooling (e.g. streams-local).
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
# prisma.config.ts uses env("DATABASE_URL"); postinstall runs `prisma generate` — DO must pass RUN_AND_BUILD_TIME DATABASE_URL as build-arg.
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# DO passes RUN_AND_BUILD_TIME vars as docker build --build-arg (required for Prisma + NEXT_PUBLIC_* at build).
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_FRONTEND_URL=${NEXT_PUBLIC_FRONTEND_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
