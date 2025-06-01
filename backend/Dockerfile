FROM node:18

RUN apt-get update && apt-get install -y sqlite3

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

# Run seed.js before starting the server
CMD ["sh", "-c", "node seed.js && node index.js"]
