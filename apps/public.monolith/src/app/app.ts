import type { Env } from './env'

import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import rateLimit from 'express-rate-limit'

import { Application } from '@davna/applications'
import { routes } from './routes'

interface Config {
  env: Env
  port: number
}

function limiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 2500,
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

export function App({ env, port }: Config) {
  const app = Application({ routes: routes(env), port })

  const upload = multer({ storage: multer.memoryStorage() })
  const exposed = app.exposeApp()
  exposed.use(
    cors({
      origin: '*',
    }),
  )
  exposed.use(limiter())
  exposed.use(helmet())

  exposed.post('/audio', upload.single('file'), (req, res, next) => {
    if (!req.file)
      return res.status(400).json({ message: 'Audio file is missing' })
    ;(req as any).ctx = { file: req.file }

    return next()
  })

  return app
}
