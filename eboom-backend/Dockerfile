FROM node:20-slim AS dev

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Source is bind-mounted by Compose (compose.yaml) — nothing to COPY here.

EXPOSE 4000

CMD ["npm", "run", "dev"]

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
# Seed scripts resolve SQL via __dirname (dist/db/seed/sql)
COPY src/db/seed/sql ./dist/db/seed/sql
# migrate.js resolves the folder via __dirname (dist/db/migrations) and tsc
# does not carry .sql files into dist, so copy the migrations in explicitly.
COPY src/db/migrations ./dist/db/migrations

EXPOSE 4000

# The container only serves the API — it never touches the schema on boot.
# Applying migrations is a deliberate, separate step against a database you
# have backed up: `docker compose -f compose.prod.yaml exec backend node
# dist/db/migrate.js` (see "Running in Production" in README.md).
CMD ["node", "dist/app.js"]
