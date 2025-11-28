# Stage 1:
FROM node:20-alpine AS build
WORKDIR /app

COPY . ./
RUN yarn install --frozen-lockfile
RUN yarn test:modules
RUN yarn workspace @davna/api run test

RUN yarn workspace @davna/api run build

# Stage 2:
FROM node:20-alpine AS runtime
WORKDIR /app

COPY ./scripts/wait-for.sh /usr/local/bin/wait-for.sh
RUN chmod +x /usr/local/bin/wait-for.sh

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/temp ./temp
COPY --from=build /app/apps/api/package.json ./

RUN yarn install --frozen-lockfile --production

RUN addgroup -S app && adduser -S app -G app
RUN chown app:app /app/temp
USER app

ENV NODE_ENV=production
EXPOSE 3333

CMD ["yarn", "start"]
