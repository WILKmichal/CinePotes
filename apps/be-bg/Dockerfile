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

# Copie les fichiers
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Change ownership et supprime toutes les permissions d'écriture
RUN chown -R nodejs:nodejs /app && \
    find /app -type d -exec chmod 0500 {} \; && \
    find /app -type f -exec chmod 0400 {} \;

# Change vers l'utilisateur non-root
USER nodejs

# Expose et start
EXPOSE 3000
CMD ["node", "dist/main.js"]