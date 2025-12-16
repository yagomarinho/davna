/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import rateLimit from 'express-rate-limit'

import { Application } from '@davna/applications'
import { getRoutes } from './routes'
import { Env } from './env'

function limiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 500,
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
    port: 3334,
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
  exposed.post('/metadata', upload.single('file'), extractFile())
  exposed.post('/convert', upload.single('file'), extractFile())

  return app
}

function extractFile() {
  return (req, res, next) => {
    if (!req.file)
      return res.status(400).json({ message: 'Audio file is missing' })
    ;(req as any).ctx = { file: req.file }

    return next()
  }
}
