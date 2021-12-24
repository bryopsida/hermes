FROM node:lts-alpine AS qa
WORKDIR /usr/src/app
COPY package*.json .
RUN npm audit && npm ci && npm run lint && npm run build && npm test && npm run sonar --if-present

FROM node:lts-alpine AS build
WORKDIR /usr/src/app
COPY . .
RUN npm ci && npm build

FROM node:lts-alpine AS libraries
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