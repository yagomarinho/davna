import 'dotenv/config'

import http from 'node:http'

import { Application } from './shared/app/application'

import { routes } from './routes'

import { Env } from './env'
import { createWsServer } from './shared/helpers/create.ws.server'

Env().then(env => {
  const PORT = process.env.PORT || 3333

  const app = Application({ routes: routes(env) })
  const server = createWsServer(http.createServer(app.exposeApp()), env)

  // eslint-disable-next-line no-console
  server.listen(PORT, () => console.log(`Server Ws+Http Start Running...`))
})

export interface Config {
  driver?: STORAGE_TYPE
}

export interface StorageConstructor {
  (config: Config): Storage
}

export const Storage: StorageConstructor = ({
  driver = process.env.STORAGE_DRIVER_DEFAULT as any,
}) => {
  const drivers = {
    [STORAGE_TYPE.MONGO_GRIDFS]: MongoDBStorage,
    [STORAGE_TYPE.AWS_S3]: AWSS3Storage,
  }

  const configs = {
    [STORAGE_TYPE.MONGO_GRIDFS]: config.providers.storage.mongodb,
    [STORAGE_TYPE.AWS_S3]: config.providers.storage.awsS3,
  }

  const conf = configs[driver] as any

  return drivers[driver](conf)
}
