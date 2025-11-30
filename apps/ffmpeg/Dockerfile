# Stage 1: Test Environment and Build
FROM node:22-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY . ./

RUN yarn install --frozen-lockfile

ENV NODE_ENV=development
RUN yarn workspace @davna/health run test

RUN yarn workspace @davna/ffmpeg run build

# Stage 2: Copy Files and Expose Port
FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=build /app/apps/ffmpeg/dist ./dist
COPY --from=build /app/apps/ffmpeg/package.build.json ./package.json

RUN yarn install --frozen-lockfile --production

RUN addgroup -S app && adduser -S app -G app
USER app

ENV NODE_ENV=production
EXPOSE 3334

CMD ["yarn", "start"]
