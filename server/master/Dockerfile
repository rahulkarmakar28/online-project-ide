FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache \
    openssl \
    bash \
    git \
    python3 \
    make \
    g++

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN mkdir -p /app/projects

EXPOSE 3000

# FIX 1: "prisma migrate" alone is not a valid command — must be "migrate deploy"
# FIX 2: removed "prisma db push" — it conflicts with migrations in production
#         (db push is for prototyping only, migrate deploy is for production)
# FIX 3: removed duplicate "prisma generate" — already done at build time above
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]