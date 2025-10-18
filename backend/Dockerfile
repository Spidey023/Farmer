# Base image with Node.js (small Alpine Linux)
FROM node:18-alpine

# Create app directory inside the container
WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./

# Install dependencies (uses package-lock.json for reproducible builds)
RUN npm ci

# Copy the rest of the project
COPY . .

# Build TypeScript -> JavaScript
RUN npm run build

# Expose the app port
EXPOSE 3000

# Start the app (uses compiled JS in /dist)
CMD ["npm", "run", "start"]
