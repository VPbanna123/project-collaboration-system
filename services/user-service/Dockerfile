FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY services/user-service/package*.json ./
COPY services/shared ./services/shared
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY services/user-service ./
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3001
ENV PORT=3001

CMD ["node", "dist/index.js"]
