FROM node:18.15-slim as builder

WORKDIR /builder
COPY . ./

RUN npm ci && npm run compile && rm -rf node_modules

##################################################

FROM node:18.15-slim

ENV NODE_ENV production

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node

COPY --from=builder /builder .
RUN npm ci --production

WORKDIR /app
CMD ["node", "--experimental-network-imports", "out/bin/http.js"]
