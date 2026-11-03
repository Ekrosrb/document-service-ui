FROM node:24-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html jsconfig.json components.json vite.config.js ./
COPY src src
COPY public public
RUN npm run build

FROM nginx:1.29-alpine
COPY --from=build /workspace/dist /usr/share/nginx/html
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_HOST="host.docker.internal" \
    API_PORT="55535" \
    NGINX_ENVSUBST_FILTER="^API_"
EXPOSE 80
