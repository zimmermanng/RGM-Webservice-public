FROM node:24.14.0

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

# Change if your backend uses a different port
EXPOSE 3011

CMD ["node", "index.js"]
