# ─── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables (injected via --build-arg or docker-compose)
# ARG PUBLIC_WEB_FORMS_API_KEY
# ARG PUBLIC_WEB_FORMS_URL
# ARG SANITY_PROJECT_ID
# ARG SANITY_DATASET=production
# ARG SANITY_API_TOKEN

# ENV PUBLIC_WEB_FORMS_API_KEY=$PUBLIC_WEB_FORMS_API_KEY
# ENV PUBLIC_WEB_FORMS_URL=$PUBLIC_WEB_FORMS_URL
# ENV SANITY_PROJECT_ID=$SANITY_PROJECT_ID
# ENV SANITY_DATASET=$SANITY_DATASET
# ENV SANITY_API_TOKEN=$SANITY_API_TOKEN
# ENV NODE_ENV=production

RUN npm run build:docker

# ─── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=builder /app/dist ./dist

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
