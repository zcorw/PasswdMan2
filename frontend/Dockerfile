FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

COPY . .
RUN yarn build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
