#Stage 1: Build Frontend
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

#Stage 2: Serve with nginx
FROM nginxinc/nginx-unprivileged:1.28-alpine

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY --chown=nginx:nginx --from=build /app/build /usr/share/nginx/html

USER nginx
EXPOSE 8080

ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]
CMD ["-g", "daemon off;"]
