FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# `prisma generate` only parses schema.prisma — it never connects — but it
# does require every env var referenced there (both url and directUrl) to be
# set to *something*.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Alpine (musl) doesn't ship OpenSSL by default. Without it Prisma can't
# detect the right query-engine build and silently falls back to a guess.
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
# postinstall (`prisma generate`) needs prisma/schema.prisma, which is why
# it's copied in above. Runs as root (before USER switch below) so the
# downloaded query-engine binaries end up world-readable/executable —
# the non-root user at runtime only needs to read and run them, not write.
RUN npm ci --omit=dev

COPY src ./src

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Applies pending migrations, then starts the server. Requires `prisma`
# (the CLI) to be a regular dependency, not a devDependency — see
# package.json — otherwise `npm ci --omit=dev` above would strip it out.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
