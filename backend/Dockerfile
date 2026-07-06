# ---- builder: full deps (needed for `prisma generate`) + generate the client ----
FROM node:22-alpine AS builder
WORKDIR /app
# `prisma generate` only parses schema.prisma — it never connects — but it
# does require the env var referenced there to be set to *something*.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Alpine (musl) doesn't ship OpenSSL by default. Without it Prisma can't
# detect the right query-engine build and silently falls back to a guess —
# install it so the engine generated here matches what's actually on the
# runtime image below.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# ---- runtime: slim image, prod deps only ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src ./src

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Applies pending migrations, then starts the server. Requires `prisma`
# (the CLI) to be a regular dependency, not a devDependency — see
# package.json — otherwise `npm ci --omit=dev` above would strip it out.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
