FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all project files
COPY . .

# Build the frontend application
RUN npm run build

# Expose the API port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production
ENV VITE_API_URL=/api

# Start the server (which will also serve the static frontend in production)
CMD ["npm", "run", "server"]
