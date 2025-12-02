import { resolve } from 'node:path'
import dotenv from 'dotenv'

const path = resolve(__dirname, '../../../.env')
dotenv.config({ path })

/* --------------------------------------------- */
import { App } from './app/app'
import { Env } from './app/env'

const app = App(Env())

app.mount()

// eslint-disable-next-line no-console
app.start().then(() => console.log(`Microservice: ffmpeg Start Running...`))
