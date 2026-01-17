# Multi-stage build for API server
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8

FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm --filter db generate

# Build API
RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3001 
# Copy built application
CMD ["node", "dist/index.js"]
