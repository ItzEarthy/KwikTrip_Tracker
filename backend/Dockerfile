# Use Node.js 18
FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose backend API port
EXPOSE 3001

# Default run command
CMD ["node", "index.js"]
