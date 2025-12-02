import request from 'supertest'
import { App } from '../app/app'
import { Env } from '../app/env'
import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'

const env = Env()

function readFileAsBuffer(filePath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const stream = createReadStream(filePath)

    stream.on('data', (chunk: any) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

describe('application tests', () => {
  let app: any

  beforeAll(async () => {
    process.env.NODE_ENV = 'production'

    const a = App(env)
    a.mount()
    app = a.exposeApp()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uploads audio (buffer) and returns duration', async () => {
    const filePath = resolve(__dirname, '../../temp/audiotest.m4a')
    const audio = await readFileAsBuffer(filePath)

    const res = await request(app)
      .post('/')
      .set(
        env.config.auth.apiKey.headerName,
        'apikey=' + env.config.auth.apiKey.key,
      )
      .attach('file', audio, {
        filename: 'audiotest.m4a',
        contentType: 'audio/wav',
      })
      .expect(200)

    expect(res.body).toHaveProperty('duration')
    expect(res.body.duration).toEqual(expect.any(Number))
  })

  afterAll(async () => {})
})
