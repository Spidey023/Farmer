# 1️⃣ Base image
FROM node:18-alpine

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package files first (for dependency install caching)
COPY package*.json ./


# 4️⃣ Copy Prisma schema early (so postinstall can find it)
COPY prisma ./prisma

# 5️⃣ Install dependencies (will trigger postinstall and run prisma generate)
RUN npm ci && npx prisma generate

# 6️⃣ Copy remaining source code
COPY . .

# 7️⃣ Build the TypeScript project
RUN npm run build

# 8️⃣ Expose port (adjust to your app port)
EXPOSE 3000

# 9️⃣ Run the app
CMD ["npm", "start"]
