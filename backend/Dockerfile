FROM node:24.14.0

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
COPY frontend/src/components/data/struktur.json /frontend/src/components/data/struktur.json
RUN npx prisma generate

# Change if your backend uses a different port
EXPOSE 3011

CMD ["node", "index.js"]
