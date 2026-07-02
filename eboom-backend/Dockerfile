FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY drizzle.config.js ./
COPY src/db/schema ./src/db/schema
COPY src/db/seed ./src/db/seed

EXPOSE 4000

CMD ["sh", "-c", "npx drizzle-kit push --force && node dist/app.js"]
