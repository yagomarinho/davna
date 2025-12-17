/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolve } from 'node:path'
import type { Env } from '../../app'

import { InMemoryRepository } from '@davna/infra'
import { FakeAI } from '@davna/infra'
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
      suggestions: InMemoryRepository(),
      roles: InMemoryRepository(),
    },
  }
}
