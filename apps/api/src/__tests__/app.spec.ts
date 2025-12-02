import request from 'supertest'
import { InMemoryRepository } from '@davna/repositories'

import type { Env } from '../app'
import { App } from '../app'

import { resolve } from 'node:path'

function makeEnv(): Env {
  return {
    constants: {
      tempDir: resolve(__dirname, '../../temp'),
    },
    providers: {
      auth,
      gpt,
      messageHandler,
      multimedia,
      signer,
      storage,
    },
    repositories: {
      accounts: InMemoryRepository(),
      audios: InMemoryRepository(),
      classrooms: InMemoryRepository(),
      leads: InMemoryRepository(),
      messages: InMemoryRepository(),
      sessions: InMemoryRepository(),
    },
  }
}

describe('application tests', () => {
  const env = makeEnv()

  let app: any

  beforeAll(() => {
    const a = App({ env, port: 3333 })
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
})
