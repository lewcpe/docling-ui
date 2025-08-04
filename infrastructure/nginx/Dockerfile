FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy configuration files
COPY conf.d/ /etc/nginx/conf.d/
COPY nginx.conf /etc/nginx/nginx.conf

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1