FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

# Copy package files
COPY services/project-service/package*.json ./project-service/

# Copy shared folder (proto files, middleware, types)
COPY services/shared ./shared/

WORKDIR /app/project-service
RUN npm ci

FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/project-service/node_modules ./project-service/node_modules

# Copy shared folder
COPY services/shared ./shared/

# Copy service source
COPY services/project-service ./project-service/

WORKDIR /app/project-service
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/project-service/dist ./dist
COPY --from=builder /app/project-service/node_modules ./node_modules
COPY --from=builder /app/project-service/package*.json ./

# Copy shared folder for runtime (proto files needed by gRPC)
COPY --from=builder /app/shared ../shared/

EXPOSE 3003 50003
ENV PORT=3003
ENV GRPC_PORT=50003

CMD ["node", "dist/index.js"]
