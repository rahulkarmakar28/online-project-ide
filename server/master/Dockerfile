FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl bash
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . .
RUN npx prisma generate
RUN mkdir -p /app/projects && chmod 777 /app/projects
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]