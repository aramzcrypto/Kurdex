FROM node:22-slim

# Install sqlite3 dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Exposure PORT
EXPOSE 3000

# Start command
CMD ["node", "server.js"]
