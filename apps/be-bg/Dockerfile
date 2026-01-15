# ---------------------
#   BUILD
# ---------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Installe pnpm
RUN npm install -g pnpm

# Copie tous les fichiers
COPY . .

# Installation (@nestjs/config est déjà dans package.json)
RUN pnpm install --no-frozen-lockfile

# Build
RUN pnpm run build

# ---------------------
#   RUN
# ---------------------
FROM node:20-alpine
WORKDIR /app

# Crée un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copie avec permissions minimales strictes
# 0400 = read-only pour owner uniquement (fichiers)
# 0500 = read+execute pour owner uniquement (dossiers)
COPY --from=builder --chown=nodejs:nodejs --chmod=0500 /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs --chmod=0500 /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs --chmod=0400 /app/package.json ./package.json

# Change vers l'utilisateur non-root
USER nodejs

# Expose et start
EXPOSE 3000
CMD ["node", "dist/main.js"]