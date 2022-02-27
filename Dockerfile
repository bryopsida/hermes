FROM node:17.6.0-alpine as build-base
RUN apk add --update --no-cache python3 make g++ bash

FROM build-base AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json .
RUN npm run build

FROM build-base AS libraries
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production


FROM node:17.6.0-alpine
RUN apk add dumb-init curl
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=libraries /usr/src/app/node_modules /usr/src/app/node_modules

COPY --chown=node:node --from=build /usr/src/app/build/src/ /usr/src/app/
EXPOSE 3000
CMD ["dumb-init", "node", "monoApp.js"]