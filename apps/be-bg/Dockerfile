# ---------------------
#   BUILD
# ---------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Installe pnpm
RUN npm install -g pnpm

# Copie l’ensemble du monorepo Turbo
COPY . .

# Installation & Build
RUN pnpm install --recursive
RUN pnpm run build

# ---------------------
#   RUN
# ---------------------
FROM node:20-alpine

WORKDIR /apps/be-bg

# Installe pnpm
RUN npm install -g pnpm

# Copie node_modules et la build du backend
COPY --from=builder /apps/be-bg/dist ./dist
COPY --from=builder /apps/be-bg/node_modules ./node_modules

# Expose et start
EXPOSE 3000
CMD ["node", "dist/main.js"]
