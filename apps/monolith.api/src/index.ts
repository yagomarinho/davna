import { resolve } from 'node:path'
import dotenv from 'dotenv'

const path = resolve(__dirname, '../../../.env')
dotenv.config({ path })

/* --------------------------------------------- */

import http from 'node:http'
import { App, Env, createWsServer } from './app'

Env().then(env => {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3333
  const app = App({ env, port: PORT })
  const exposed = app.exposeApp()
  app.mount()
  const server = createWsServer(http.createServer(exposed), env)

  // eslint-disable-next-line no-console
  server.listen(PORT, () => console.log(`Server Ws+Http Start Running...`))
})
