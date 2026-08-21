FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --ignore-scripts

# Copy source code
COPY . .

# Build backend
RUN pnpm build

# --- Production stage ---
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --ignore-scripts

# Copy built code
COPY --from=builder /app/dist ./dist
# Also need package.json for some nest stuff or scripts if we run seed from here
COPY --from=builder /app/src/seed.ts ./src/seed.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.build.json ./tsconfig.build.json

EXPOSE 3000

CMD ["node", "dist/main"]
