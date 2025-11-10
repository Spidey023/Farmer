# 1️⃣ Base image
FROM node:18-alpine

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package files first (for dependency install caching)
COPY package*.json ./

# 4️⃣ Copy Prisma schema early (so postinstall can find it)
COPY prisma ./prisma

# 5️⃣ Install dependencies (will trigger postinstall and run prisma generate)
#    Make sure schema.prisma has:
#    generator client { provider = "prisma-client-js"; output = "../src/generated/prisma" }
RUN npm ci && npx prisma generate

# 6️⃣ Copy remaining source code
COPY . .

# 7️⃣ Build the TypeScript project, then copy generated client into dist/
RUN npm run build && \
    mkdir -p dist/generated && cp -r src/generated/* dist/generated/

# 8️⃣ Expose port (adjust to your app port)
EXPOSE 3000

# 9️⃣ Run the app
CMD ["npm", "start"]
