FROM oven/bun:1-slim AS base
WORKDIR /app

# Workspace manifests + lockfile first for better layer caching
COPY package.json bun.lock tsconfig.base.json ./
COPY core/package.json core/tsconfig.json ./core/
COPY server/package.json server/tsconfig.json server/prisma.config.ts ./server/
COPY server/prisma/ ./server/prisma/

# Stub the client workspace so Bun's workspace resolver doesn't fail
# (client/ is excluded from the build context via .dockerignore)
RUN mkdir -p /app/client && echo '{"name":"@helpdesk/client","version":"1.0.0"}' > /app/client/package.json

# Install all workspace deps — postinstall runs `bunx prisma generate`
# Dummy DATABASE_URL satisfies Prisma's config loader during install
RUN DATABASE_URL="postgresql://x:x@localhost:5432/x" bun install

# Copy source after deps so source-only changes don't bust the install cache
COPY core/src/ ./core/src/
COPY server/src/ ./server/src/
COPY FAQ.md ./

WORKDIR /app/server
EXPOSE 3000

# sh -c needed to chain commands with && in exec form
CMD ["sh", "-c", "bun run node_modules/prisma/build/index.js migrate deploy && bun src/index.ts"]
