# Stage 1: Build Frontend
FROM dhi.io/node:24.13.1-alpine3.23 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Production Build (statt npm start)
RUN npm run build

# Stage 2: Serve mit NGINX
FROM nginx:1.28.2
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]