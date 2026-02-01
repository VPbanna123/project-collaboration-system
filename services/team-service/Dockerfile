FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY services/team-service/package*.json ./
COPY services/shared ./services/shared
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY services/team-service ./
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3002
ENV PORT=3002

CMD ["node", "dist/index.js"]
