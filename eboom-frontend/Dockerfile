FROM node:22-slim AS builder

WORKDIR /app/eboom-frontend

ARG NEXT_PUBLIC_BASE_URL=http://localhost:4000
ARG NEXT_PUBLIC_GITHUB_URL=https://github.com
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_GITHUB_URL=$NEXT_PUBLIC_GITHUB_URL

COPY eboom-frontend/package.json eboom-frontend/package-lock.json ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci --no-audit --no-fund \
  && test -x node_modules/.bin/next

COPY eboom-frontend/ .

RUN npm run build

FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/eboom-frontend/public ./public
COPY --from=builder /app/eboom-frontend/.next/standalone ./
COPY --from=builder /app/eboom-frontend/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
