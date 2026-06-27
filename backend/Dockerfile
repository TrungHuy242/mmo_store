FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build (if needed)
RUN npm run build 2>/dev/null || true

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "src/server.js"]
