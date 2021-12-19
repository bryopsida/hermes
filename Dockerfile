FROM node:latest AS build
WORKDIR /usr/src/app
COPY . .
RUN npm ci
RUN npm run build

FROM node:latest AS libraries
WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci --only=production

FROM node:lts-alpine
RUN apk add dumb-init curl
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=libraries /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node --from=build /usr/src/app/src/*.js /usr/src/app/
CMD ["dumb-init", "node", "monoApp.js"]