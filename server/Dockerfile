# Gunakan base image Node dengan dependensi Chromium yang lengkap
FROM node:20-slim

# Install dependency sistem untuk Puppeteer/Chromium headless
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Salin dependencies manifest
COPY package*.json ./
RUN npm ci

# Salin seluruh kode backend
COPY . .

# Build typescript
RUN npm run build

# Buat direktori data untuk SQLite jika belum ada
RUN mkdir -p /app/data

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start"]
