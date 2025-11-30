# Stage 1: Test Environment and Build
FROM node:22-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY . ./

RUN yarn install --frozen-lockfile

ENV NODE_ENV=development
RUN yarn workspace @davna/account run test
RUN yarn workspace @davna/classroom run test
RUN yarn workspace @davna/lead run test
RUN yarn workspace @davna/api run test

RUN yarn workspace @davna/api run build

# Stage 2:
FROM node:22-alpine AS runtime
WORKDIR /app

COPY ./scripts/wait-for-mongo.sh /usr/local/bin/wait-for-mongo.sh
COPY ./scripts/wait-for-health.sh /usr/local/bin/wait-for-health.sh
COPY ./scripts/wait-for.sh /usr/local/bin/wait-for.sh
RUN chmod +x /usr/local/bin/wait-for-mongo.sh
RUN chmod +x /usr/local/bin/wait-for-health.sh
RUN chmod +x /usr/local/bin/wait-for.sh

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/temp ./temp

RUN addgroup -S app && adduser -S app -G app
RUN chown app:app /app/temp
USER app

ENV NODE_ENV=production
EXPOSE 3333

CMD ["node", "./dist/index.js"]
