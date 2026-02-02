# Dockerfile for fly.io deployment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all source files (frontend + backend)
COPY . .

# Make init script executable
RUN chmod +x init-data.sh

# Expose port (fly.io uses PORT environment variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server (init data first, then start node)
CMD ["sh", "-c", "./init-data.sh && node server.js"]
