FROM node:24.14.0

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
COPY frontend/src/components/data/struktur.json /frontend/src/components/data/struktur.json
RUN npx prisma generate

CMD ["node", "index.js"]
