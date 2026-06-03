FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build-time env vars — Vite bakes these into the bundle at build time.
# Must be passed as build args, not runtime environment variables.
ARG VITE_API_URL=http://localhost:3000
ARG VITE_WORKER_TERMINAL_URL=ws://localhost:4000
ARG VITE_WORKER_EDITOR_URL=http://localhost:5000

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WORKER_TERMINAL_URL=$VITE_WORKER_TERMINAL_URL
ENV VITE_WORKER_EDITOR_URL=$VITE_WORKER_EDITOR_URL

RUN npm run build

# ── Serve the built output with a lightweight static server ──────────────────
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]