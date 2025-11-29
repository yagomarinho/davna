import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import rateLimit from 'express-rate-limit'

import { Application } from '@davna/applications'
import { getRoutes } from './routes'
import { Env } from './env'

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

export const App = (env: Env) => {
  const app = Application({
    routes: getRoutes({ env }),
  })

  const exposed = app.exposeApp()

  exposed.use(
    cors({
      origin: '*',
    }),
  )
  exposed.use(limiter())
  exposed.use(helmet())

  const upload = multer({ storage: multer.memoryStorage() })
  exposed.post('/', upload.single('file'), (req, res, next) => {
    if (!req.file)
      return res.status(400).json({ message: 'Audio file is missing' })
    ;(req as any).ctx = { file: req.file }

    return next()
  })

  return app
}
