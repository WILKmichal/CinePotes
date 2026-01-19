# Build stage 1: Prune the monorepo
FROM node:20-alpine AS pruner
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Copy the entire monorepo
COPY . .
 
# Prune the monorepo to only include fe-admin and its dependencies
RUN turbo prune fe-admin --docker


# Build stage 2: Install dependencies
FROM node:20-alpine AS installer
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy lockfile and package.json files from pruned workspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Configure pnpm to allow build scripts
RUN echo "enable-pre-post-scripts=true" > .npmrc

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile


# Build stage 3: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm and turbo
RUN npm install -g pnpm turbo

# Copy installed dependencies
COPY --from=installer /app/ .

# Copy source code from pruned workspace
COPY --from=pruner /app/out/full/ .

# Build the fe-admin app
RUN pnpm turbo run build --filter=fe-admin

# Verify the build output exists and ensure public dir exists
RUN ls -la /app/apps/fe-admin/.next/
RUN mkdir -p /app/apps/fe-admin/public


# Production stage: Run the application
FROM node:20-alpine AS runner
WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment to production
ENV NODE_ENV=production

# Copy Next.js standalone build output (includes everything needed)
COPY --from=builder --chown=nextjs:nodejs /app/apps/fe-admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/fe-admin/.next/static ./apps/fe-admin/.next/static

# Copy public folder if it exists (create empty dir if not)
RUN mkdir -p ./apps/fe-admin/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/fe-admin/public ./apps/fe-admin/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js application
CMD ["node", "apps/fe-admin/server.js"]