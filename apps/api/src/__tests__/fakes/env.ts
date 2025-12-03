import { resolve } from 'node:path'
import type { Env } from '../../app'

import { InMemoryRepository } from '@davna/repositories'
import { FakeAI } from '@davna/providers'
import { MessageHandler } from '@davna/classroom'

import { makeAuth } from './auth'
import { makeMultimedia } from './multimedia'
import { makeSigner } from './signer'
import { makeStorage } from './storage'

import { Config } from '../../config'

export function makeEnv(): Env {
  const tempDir = resolve(__dirname, '../../../temp')
  const storage = makeStorage()
  const config = Config()

  return {
    constants: {
      config,
      tempDir,
    },
    providers: {
      auth: makeAuth(),
      gpt: FakeAI(config.providers.gpt['fake.ai']),
      messageHandler: MessageHandler,
      multimedia: makeMultimedia(),
      signer: makeSigner(),
      storage: () => storage({ tempDir }),
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
