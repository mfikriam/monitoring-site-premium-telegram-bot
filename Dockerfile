# Base image with Node.js
FROM node:20.18.0

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install Chromium dependencies (needed by Puppeteer)
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  fonts-noto-color-emoji \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Download Chromium for Puppeteer
RUN npx puppeteer browsers install chrome

# Set env so Puppeteer knows where Chromium is
ENV PUPPETEER_EXECUTABLE_PATH=/root/.cache/puppeteer/chrome/linux-136.0.7103.92/chrome-linux64/chrome