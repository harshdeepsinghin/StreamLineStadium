# Stage 1: Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time (Next.js config & static values)
ENV NEXT_TELEMETRY_DISABLED=1
ENV GOOGLE_CLOUD_PROJECT=hack2skill-a226e
ENV GOOGLE_CLOUD_LOCATION=us-central1
ENV GOOGLE_GENAI_USE_ENTERPRISE=true
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDjo5QgBrvBXPJnSpDI6dqNcCYRKqdL_fI
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hack2skill-a226e.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=hack2skill-a226e
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hack2skill-a226e.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=376597987794
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:376597987794:web:4c02f1467a990a3941480b
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-X143GWLBTT

RUN npm run build

# Stage 3: Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

ENV PORT=8080
# hostname binds to 0.0.0.0 for Cloud Run compatibility
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
