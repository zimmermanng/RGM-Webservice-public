FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Change if your backend uses a different port
EXPOSE 3011

CMD ["node", "index.js"]