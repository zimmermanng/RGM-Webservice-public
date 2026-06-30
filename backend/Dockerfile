FROM node:24.14.0

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3011

CMD ["npm", "start"]