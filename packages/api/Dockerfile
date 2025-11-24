FROM node:20-alpine AS build
WORKDIR /app

COPY . ./
RUN yarn install --frozen-lockfile
RUN yarn workspace @davna/api run build

COPY ./scripts/wait-for.sh /usr/local/bin/wait-for.sh
RUN chmod +x /usr/local/bin/wait-for.sh

ENV NODE_ENV=production
EXPOSE 3333

CMD ["yarn", "workspace", "@davna/api", "run", "test"]
