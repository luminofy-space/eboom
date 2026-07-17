FROM node:22-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_GITHUB_URL=https://github.com
ARG VITEPRESS_BASE=/
ENV NEXT_PUBLIC_GITHUB_URL=$NEXT_PUBLIC_GITHUB_URL
ENV VITEPRESS_BASE=$VITEPRESS_BASE

COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci --no-audit --no-fund

COPY . .

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/.vitepress/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
