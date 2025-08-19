# ---- Base (共通) ----
FROM node:22-alpine AS base
# sharp などネイティブモジュール対策
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Build ----
FROM base AS builder
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DB 初期化例: Prisma を使う場合は（schema.prisma があるなら）先に generate
# RUN npx prisma generate
# next build（output:standalone 推奨）
RUN npm run build

# ---- Runtime ----
FROM base AS runner
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# 非 root 実行（alpine の node ユーザー）
USER node

# standalone 出力物をコピー
# /app/server.js がエントリポイントになる構成
COPY --chown=node:node --from=builder /app/.next/standalone ./ 
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
COPY --chown=node:node --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
