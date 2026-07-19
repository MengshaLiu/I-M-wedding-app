# ── Stage 1: build Next.js standalone ───────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: combined runtime ─────────────────────────────────────────────────
FROM python:3.11-slim

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install supervisord
RUN pip install --no-cache-dir supervisor

# ── Backend ──────────────────────────────────────────────────────────────────
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# ── Frontend (standalone output) ──────────────────────────────────────────────
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# ── Config ───────────────────────────────────────────────────────────────────
COPY supervisord.conf /etc/supervisord.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /app
EXPOSE 8080

CMD ["/start.sh"]
