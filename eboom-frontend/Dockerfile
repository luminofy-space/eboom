FROM node:20-slim AS builder

WORKDIR /app/eboom-frontend

ARG NEXT_PUBLIC_BASE_URL=http://localhost:4000
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

COPY eboom-frontend/package.json eboom-frontend/package-lock.json ./
COPY eboom-backend/package.json ../eboom-backend/
RUN npm ci && npm install drizzle-orm@^0.45.1 --prefix ../eboom-backend && rm -rf ../eboom-backend/node_modules/@types

COPY eboom-frontend/ .
COPY eboom-backend/src/db/schema ../eboom-backend/src/db/schema

RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/eboom-frontend/public ./public
COPY --from=builder /app/eboom-frontend/.next/standalone ./
COPY --from=builder /app/eboom-frontend/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
