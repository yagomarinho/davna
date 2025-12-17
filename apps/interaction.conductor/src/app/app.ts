/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import multer from 'multer'

import { Application } from '@davna/application'
import { getRoutes } from './routes'
import { Env } from './env'

export const App = (env: Env) => {
  const app = Application({
    port: 3334,
    routes: getRoutes({ env }),
  })

  const exposed = app.exposeApp()

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
