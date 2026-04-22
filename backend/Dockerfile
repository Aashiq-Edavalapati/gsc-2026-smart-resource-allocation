# Use lightweight Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Prisma generate (important!)
RUN npx prisma generate

# Expose port (match your backend port)
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]