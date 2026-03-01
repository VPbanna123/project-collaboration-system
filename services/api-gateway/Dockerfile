FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

# Copy package files
COPY services/api-gateway/package*.json ./api-gateway/

# Copy shared folder (proto files, gRPC clients)
COPY services/shared ./shared/

WORKDIR /app/api-gateway
RUN npm ci

FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/api-gateway/node_modules ./api-gateway/node_modules

# Copy shared folder
COPY services/shared ./shared/

# Copy service source
COPY services/api-gateway ./api-gateway/

WORKDIR /app/api-gateway
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built code from builder
COPY --from=builder /app/api-gateway/dist ./dist
COPY --from=builder /app/api-gateway/node_modules ./node_modules
COPY --from=builder /app/api-gateway/package*.json ./

# Copy shared folder for runtime (proto files needed by gRPC clients)
COPY --from=builder /app/shared ../shared/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000
ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
