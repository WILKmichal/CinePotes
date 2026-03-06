# ---------------------
#   PRUNE — extract ms-schema and its workspace deps
# ---------------------
FROM node:20-alpine AS pruner
WORKDIR /app

RUN npm install -g turbo

# Copy the entire monorepo
COPY . .

# Prune to only ms-schema and its dependencies (e.g. schemas)
RUN turbo prune ms-schema --docker


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

# Build ms-schema (and any workspace deps it needs)
RUN pnpm turbo run build --filter=ms-schema


# ---------------------
#   RUN — production image
# ---------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy the full pruned workspace (node_modules, packages, dist)
# This preserves pnpm's symlink structure so workspace deps (schemas) resolve correctly
COPY --from=builder /app .

# Change ownership and remove all write permissions
RUN chown -R nodejs:nodejs /app && \
    find /app -type d -exec chmod 0500 {} \; && \
    find /app -type f -exec chmod 0400 {} \;

# Change to non-root user
USER nodejs

# Run the application
CMD ["node", "apps/ms-schema/dist/main.js"]
