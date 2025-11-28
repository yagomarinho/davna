import { resolve } from 'node:path'
import dotenv from 'dotenv'

const path = resolve(__dirname, '../../../.env')
dotenv.config({ path, quiet: true })

/* --------------------------------------------- */

import http from 'node:http'
import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import rateLimit from 'express-rate-limit'

import { Application } from '@davna/applications'

import { routes } from './routes'
import { createWsServer } from './create.ws.server'
import { Env } from './env'

Env().then(env => {
  const PORT = process.env.PORT || 3333

  const app = Application({ routes: routes(env) })

  const upload = multer({ storage: multer.memoryStorage() })
  const exposed = app.exposeApp()
  exposed.use(
    cors({
      origin: '*',
    }),
  )
  exposed.use(limiter())
  exposed.use(helmet())

  exposed.post('/audio/upload', upload.single('file'), (req, res, next) => {
    if (!req.file)
      return res.status(400).json({ message: 'Audio file is missing' })
    ;(req as any).ctx = { file: req.file }

    return next()
  })

  app.mount()

  const server = createWsServer(http.createServer(exposed), env)

  // eslint-disable-next-line no-console
  server.listen(PORT, () => console.log(`Server Ws+Http Start Running...`))
})

function limiter() {
  return rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 25,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_, response) => {
      response.status(429).json({
        status: 'error',
        message: 'To many requests. Please try again later',
      })
    },
  })
}
