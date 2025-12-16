/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolve } from 'node:path'
import dotenv from 'dotenv'

const path = resolve(__dirname, '../../../.env')
dotenv.config({ path })

/* --------------------------------------------- */
import { App, Env } from './app'

const app = App(Env())

app.mount()

// eslint-disable-next-line no-console
app.start().then(() => console.log(`Microservice: ffmpeg Start Running...`))
