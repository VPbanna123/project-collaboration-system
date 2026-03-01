FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY services/user-service/package*.json ./user-service/

# Copy shared folder (proto files, middleware, types)
COPY services/shared ./shared/

WORKDIR /app/user-service
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/user-service/node_modules ./user-service/node_modules

# Copy shared folder
COPY services/shared ./shared/

# Copy service source
COPY services/user-service ./user-service/

WORKDIR /app/user-service
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/user-service/dist ./dist
COPY --from=builder /app/user-service/node_modules ./node_modules
COPY --from=builder /app/user-service/package*.json ./

# Copy shared folder for runtime (proto files needed by gRPC)
COPY --from=builder /app/shared ../shared/

EXPOSE 3001 50001
ENV PORT=3001
ENV GRPC_PORT=50001

CMD ["node", "dist/index.js"]
