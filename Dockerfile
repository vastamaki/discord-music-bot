# Use Bun base image
FROM oven/bun:1.3.5-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /usr/src/app

# Copy dependency files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Run the bot
CMD ["bun", "run", "start"]
