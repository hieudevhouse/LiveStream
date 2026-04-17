# Use Node.js 18 slim (Debian-based) to resolve onnxruntime-node/glibc compatibility issues
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/products-services

# Change ownership of the app directory to default pre-existing 'node' user
RUN chown -R node:node /app
USER node

EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["npm", "start"]
