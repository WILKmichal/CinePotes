# ---------------------
#   PRUNE — extract worker-gmail and its workspace deps
# ---------------------
FROM node:20-alpine AS pruner
WORKDIR /app

RUN npm install -g turbo

# Copy the entire monorepo
COPY . .

# Prune to only worker-gmail and its dependencies (e.g. schemas)
RUN turbo prune worker-gmail --docker


# ---------------------
#   INSTALL — install dependencies from pruned lockfile
# ---------------------
FROM node:20-alpine AS installer
WORKDIR /app

RUN npm install -g pnpm

# Copy lockfile and package.json files from pruned workspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile


# ---------------------
#   BUILD — compile the application
# ---------------------
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm turbo

# Copy installed node_modules
COPY --from=installer /app/ .

# Copy full source code from pruned workspace
COPY --from=pruner /app/out/full/ .

# Build worker-gmail (and any workspace deps it needs)
RUN pnpm turbo run build --filter=worker-gmail


# ---------------------
#   RUN — production image
# ---------------------
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm

# Copy built application from builder
COPY --from=builder /app/apps/worker-gmail/dist ./dist
COPY --from=builder /app/apps/worker-gmail/package.json ./package.json
COPY --from=builder /app/apps/worker-gmail/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/main.js"]
