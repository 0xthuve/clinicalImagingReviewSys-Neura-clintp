# Use Node 18 Alpine as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Remove dev dependencies for smaller image
RUN npm prune --production

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Expose port 3000ss
EXPOSE 3000

# Set environment variable for pmkroduction
ENV NODE_ENV=production

# Mongo URI will be injected at runtime
# CMD starts the Next.js app
CMD ["npm", "start"]
