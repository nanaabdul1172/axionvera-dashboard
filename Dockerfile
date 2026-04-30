# Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production dependencies stage
FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Serve Stage
FROM nginx:alpine AS server

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/.next /usr/share/nginx/html/.next
COPY --from=builder /app/public /usr/share/nginx/html/public
COPY --from=deps /app/node_modules /usr/share/nginx/html/node_modules
COPY --from=builder /app/package.json /usr/share/nginx/html/
# Expose port 80
EXPOSE 80

# Make scripts directory and copy env script
RUN mkdir -p /app/scripts
COPY scripts/env.sh /app/scripts/env.sh
RUN chmod +x /app/scripts/env.sh

# Start with script execution then nginx
CMD ["/bin/sh", "-c", "/app/scripts/env.sh /usr/share/nginx/html/env-config.js && nginx -g 'daemon off;'"]
