FROM node:17-alpine as build-base
# inform noderd-kafka we want to link against the system librdkafka already installed to save build time
ENV BUILD_LIBRDKAFKA=0
RUN apk add --update --no-cache \
  python3 \
  make \
  g++ \
  bash \
  gcc \
  librdkafka \
  librdkafka-dev

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


FROM node:17-alpine
RUN apk add --update --no-cache dumb-init librdkafka
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=libraries /usr/src/app/node_modules /usr/src/app/node_modules

COPY --chown=node:node --from=build /usr/src/app/build/src/ /usr/src/app/
EXPOSE 3000
CMD ["dumb-init", "node", "monoApp.js"]