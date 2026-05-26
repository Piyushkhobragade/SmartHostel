# =========================
# Build Stage
# =========================
FROM node:20-bookworm AS builder

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y openssl sqlite3

RUN npm install

COPY . .

RUN npm run build

# =========================
# Production Stage
# =========================
FROM node:20-bookworm

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y openssl sqlite3

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/app.js"]
