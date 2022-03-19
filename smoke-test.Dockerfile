FROM node:17.7.1-alpine as build-base
RUN apk add --update --no-cache python3 make g++ bash

FROM build-base AS smoke-test-stage
WORKDIR /usr/src/app
COPY package*.json .
RUN npm ci
COPY src ./src
COPY tests ./tests
COPY tsconfig.json .
COPY .eslintrc.js .
RUN npm run build && npm test && npm audit && npm run sonarscan --if-present && npm run lint
