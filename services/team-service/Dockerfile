FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

# Copy package files
COPY services/team-service/package*.json ./team-service/

# Copy shared folder (proto files, middleware, types)
COPY services/shared ./shared/

WORKDIR /app/team-service
RUN npm ci

FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/team-service/node_modules ./team-service/node_modules

# Copy shared folder
COPY services/shared ./shared/

# Copy service source
COPY services/team-service ./team-service/

WORKDIR /app/team-service
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/team-service/dist ./dist
COPY --from=builder /app/team-service/node_modules ./node_modules
COPY --from=builder /app/team-service/package*.json ./

# Copy shared folder for runtime (proto files needed by gRPC)
COPY --from=builder /app/shared ../shared/

EXPOSE 3002 50002
ENV PORT=3002
ENV GRPC_PORT=50002

CMD ["node", "dist/index.js"]
