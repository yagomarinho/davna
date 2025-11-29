import { resolve } from 'node:path'
import dotenv from 'dotenv'

const path = resolve(__dirname, '../../../.env')
dotenv.config({ path })

/* --------------------------------------------- */
import { App } from './app'
import { Env } from './env'

const app = App(Env())

app.mount()

app.start().then(() => {})
