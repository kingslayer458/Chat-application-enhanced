# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Build Next.js application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000
ENV SOCKET_PORT=3001

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone output (includes server.js from Next.js)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy our custom Socket.IO server and its dependencies
COPY --from=builder /app/server.js ./socket-server.js
COPY --from=builder /app/start-production.js ./start-production.js
COPY --from=builder /app/node_modules ./node_modules

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose ports (Next.js and Socket.IO)
EXPOSE 3000 3001

# Start both servers
CMD ["node", "start-production.js"]
