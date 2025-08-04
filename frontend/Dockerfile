FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Run in development mode
CMD ["npm", "run", "dev"]