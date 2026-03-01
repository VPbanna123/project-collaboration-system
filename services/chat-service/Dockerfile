FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

# Copy package files
COPY services/chat-service/package*.json ./chat-service/

# Copy shared folder (proto files, middleware, types)
COPY services/shared ./shared/

WORKDIR /app/chat-service
RUN npm ci

FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/chat-service/node_modules ./chat-service/node_modules

# Copy shared folder
COPY services/shared ./shared/

# Copy service source
COPY services/chat-service ./chat-service/

WORKDIR /app/chat-service
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/chat-service/dist ./dist
COPY --from=builder /app/chat-service/node_modules ./node_modules
COPY --from=builder /app/chat-service/package*.json ./

# Copy shared folder for runtime (proto files needed by gRPC)
COPY --from=builder /app/shared ../shared/

EXPOSE 3004 50004
ENV PORT=3004
ENV GRPC_PORT=50004

CMD ["node", "dist/index.js"]
