#Stage 1: Build Frontend
FROM dhi.io/node:24-alpine3.22-dev AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

#Stage 2: Serve with nginx
FROM dhi.io/nginx:1.28.0-alpine3.21-dev

COPY nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx --from=build /app/build /usr/share/nginx/html

USER nginx
EXPOSE 8080

ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]
CMD ["-g", "daemon off;"]
