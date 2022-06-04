FROM node:17.9.0-alpine as build-base
RUN apk add --update --no-cache \
  python3 \
  make \
  g++ \
  bash \
  ca-certificates \
  lz4-dev \
  musl-dev \
  cyrus-sasl-dev \
  openssl-dev
WORKDIR /usr/src/app

# see if we can create stable layer to cache the node-gyp build for alpine + arm64 for the node bindings around librdkafka
# otherwise the build can take 20-30 minutes to get the kafka client package on musl arm64
RUN npm install node-rdkafka

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


FROM node:17.9.0-alpine
RUN apk add dumb-init curl
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=libraries /usr/src/app/node_modules /usr/src/app/node_modules

COPY --chown=node:node --from=build /usr/src/app/build/src/ /usr/src/app/
EXPOSE 3000
CMD ["dumb-init", "node", "monoApp.js"]