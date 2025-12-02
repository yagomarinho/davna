import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
import request from 'supertest'

import { App } from '../app/app'
import { Env } from '../app/env'

import { AudioInfo } from '../services/get.audio.metadata'
import { Audio } from '../services/convert.audio.to.aac'

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
  const env = Env()

  beforeAll(async () => {
    const a = App(env)
    a.mount()
    app = a.exposeApp()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('health check', async () => {
    const res = await request(app).get('/health').expect(200)

    expect(res.body.healthy).toBeTruthy()
  })

  it('uploads audio (buffer) and returns duration', async () => {
    const filePath = resolve(env.config.tempDir, 'audiotest.m4a')
    const audio = await readFileAsBuffer(filePath)

    const res = await request(app)
      .post('/metadata')
      .set(
        env.config.auth.apiKey.headerName,
        'apikey=' + env.config.auth.apiKey.key,
      )
      .attach('file', audio, {
        filename: 'audiotest.m4a',
        contentType: 'audio/mp4',
      })
      .expect(200)

    const metadata: AudioInfo = res.body
    expect(metadata).toEqual(
      expect.objectContaining({
        name: 'audiotest.m4a',
        mime: 'audio/mp4',
        codec: 'aac',
        duration: 12.543771,
        format: expect.stringContaining('mp4'),
      }),
    )
  })

  it('converts audio ogg (buffer) and returns an audio acc codec', async () => {
    const filePath = resolve(env.config.tempDir, 'audiotest.ogg')
    const audio = await readFileAsBuffer(filePath)

    const res = await request(app)
      .post('/convert')
      .set(
        env.config.auth.apiKey.headerName,
        'apikey=' + env.config.auth.apiKey.key,
      )
      .attach('file', audio, {
        filename: 'audiotest',
        contentType: 'audio/ogg',
      })
      .expect(200)

    const converted: Audio = res.body
    expect(converted).toHaveProperty('buffer')
    expect(converted).toEqual(
      expect.objectContaining({
        name: 'audiotest',
        mime: 'audio/mp4',
        codec: 'aac',
        duration: expect.any(Number),
        format: expect.stringContaining('mp4'),
      }),
    )
  })

  it('converts audio webm (buffer) and returns an audio acc codec', async () => {
    const filePath = resolve(env.config.tempDir, 'audiotest.webm')
    const audio = await readFileAsBuffer(filePath)

    const res = await request(app)
      .post('/convert')
      .set(
        env.config.auth.apiKey.headerName,
        'apikey=' + env.config.auth.apiKey.key,
      )
      .attach('file', audio, {
        filename: 'audiotest',
        contentType: 'audio/webm',
      })
      .expect(200)

    const converted: Audio = res.body
    expect(converted).toHaveProperty('buffer')
    expect(converted).toEqual(
      expect.objectContaining({
        name: 'audiotest',
        mime: 'audio/mp4',
        codec: 'aac',
        duration: expect.any(Number),
        format: expect.stringContaining('mp4'),
      }),
    )
  })

  it('returns same mp4 audio (buffer)', async () => {
    const filePath = resolve(env.config.tempDir, 'audiotest.m4a')
    const audio = await readFileAsBuffer(filePath)

    const metadata = await request(app)
      .post('/metadata')
      .set(
        env.config.auth.apiKey.headerName,
        'apikey=' + env.config.auth.apiKey.key,
      )
      .attach('file', audio, {
        filename: 'audiotest',
        contentType: 'audio/mp4',
      })
      .expect(200)

    expect(metadata.body).toEqual(
      expect.objectContaining({
        name: 'audiotest',
        mime: 'audio/mp4',
        codec: 'aac',
        duration: 12.543771,
        format: expect.stringContaining('mp4'),
      }),
    )

    const converted = await request(app)
      .post('/convert')
      .set(
        env.config.auth.apiKey.headerName,
        'apikey=' + env.config.auth.apiKey.key,
      )
      .attach('file', audio, {
        filename: 'audiotest',
        contentType: 'audio/ogg',
      })
      .expect(200)

    const { name, mime, codec, format } = metadata.body

    expect(converted.body).toHaveProperty('buffer')
    expect(converted.body).toEqual(
      expect.objectContaining({
        name,
        mime,
        codec,
        format,
      }),
    )
  })
})
