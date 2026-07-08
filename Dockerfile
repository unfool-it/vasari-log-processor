# STAGE 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Leverage layer caching for dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY . .
RUN npm run build

# STAGE 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install production-only dependencies using modern flags
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy only the compiled artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Security: Adopt non-root identity
USER node

# Metadata and execution
EXPOSE 8080
CMD ["node", "dist/index.js"]

/** Notes:
   * The effectiveness of this Dockerfile is heavily dependent on a `.dockerignore` file to exclude local `node_modules` and documentation from the initial `COPY . .` command.
   * The use of the `node` user is a critical security best practice. Ensure that the `/app` directory permissions are correctly handled if the application requires write access at runtime
   * For mission-critical production environments, consider pinning the base image to a specific SHA256 hash or a minor version (e.g., `node:20.11.0-alpine`) to ensure build reproducibility
   * If the application does not handle `SIGTERM` or `SIGINT` gracefully, consider using a lightweight init system like `tini` to manage zombie processes.
   */
