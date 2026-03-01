FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

# Copy package files
COPY services/notification-service/package*.json ./notification-service/

# Copy shared folder (proto files, middleware, types)
COPY services/shared ./shared/

WORKDIR /app/notification-service
RUN npm ci

FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/notification-service/node_modules ./notification-service/node_modules

# Copy shared folder
COPY services/shared ./shared/

# Copy service source
COPY services/notification-service ./notification-service/

WORKDIR /app/notification-service
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/notification-service/dist ./dist
COPY --from=builder /app/notification-service/node_modules ./node_modules
COPY --from=builder /app/notification-service/package*.json ./

# Copy shared folder for runtime (proto files needed by gRPC)
COPY --from=builder /app/shared ../shared/

EXPOSE 3005 50005
ENV PORT=3005
ENV GRPC_PORT=50005

CMD ["node", "dist/index.js"]
