FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# CRA usually 3000, Vite usually 5173 (we’ll map in compose)
EXPOSE 3010

CMD ["npm", "start"]