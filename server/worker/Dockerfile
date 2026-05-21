FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache bash
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
EXPOSE 4000 5000
CMD ["npm", "run", "start"]