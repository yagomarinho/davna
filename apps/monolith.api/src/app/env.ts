/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolve } from 'node:path'
import {
  Auth,
  ChatGPT,
  FakeAI,
  FirebaseAdminAuth,
  GPTModel,
  JWTSigner,
  Signer,
} from '@davna/infra'
import { Repository, Writable } from '@davna/core'
import { MongoClient } from '@davna/infra'

import {
  Account,
  AccountRepository,
  Session,
  SessionRepository,
} from '@davna/identity.access'
import {
  Audio,
  AudioRepository,
  Classroom,
  ClassroomRepository,
  Message,
  MessageHandler,
  MessageRepository,
  MultimediaProvider,
  Storage,
  StorageConstructor,
} from '@davna/classroom'
import {
  Lead,
  LeadRepository,
  Suggestion,
  SuggestionRepository,
} from '@davna/feedback'
import { Role, RoleRepository } from '@davna/access.control'
import { Multimedia } from './multimedia'

import { Config } from '../config'

export interface Env {
  repositories: {
    accounts: Repository<Account>
    audios: Repository<Audio>
    classrooms: Repository<Classroom>
    leads: Writable<Repository<Lead>>
    messages: Repository<Message>
    roles: Repository<Role>
    sessions: Repository<Session>
    suggestions: Writable<Repository<Suggestion>>
  }
  providers: {
    auth: Auth
    gpt: GPTModel
    signer: Signer
    multimedia: MultimediaProvider
    messageHandler: MessageHandler
    storage: StorageConstructor
  }
  constants: {
    config: ReturnType<typeof Config>
    tempDir: string
  }
}

export const Env = async (): Promise<Env> => {
  const config = Config()

  const auth = FirebaseAdminAuth({ config })
  const gpt =
    config.providers.gpt.default_driver === 'chatgpt'
      ? ChatGPT(config.providers.gpt.chatgpt)
      : FakeAI(config.providers.gpt['fake.ai'])
  const signer = JWTSigner({
    secret: config.auth.jwt.secret,
  })

  const client = new MongoClient(config.databases.default_uri)

  const accounts = AccountRepository({ client })
  const audios = AudioRepository({ client })
  const classrooms = ClassroomRepository({ client })
  const messages = MessageRepository({ client })
  const roles = RoleRepository({ client })
  const sessions = SessionRepository({ client })

  const leads = LeadRepository({
    credentials: config.providers.gcp.credentials,
    ...config.databases.lead,
  })

  const suggestions = SuggestionRepository({
    credentials: config.providers.gcp.credentials,
    ...config.databases.suggestion,
  })

  await Promise.all([
    accounts.connect(),
    audios.connect(),
    classrooms.connect(),
    messages.connect(),
    roles.connect(),
    sessions.connect(),
  ])

  const repositories = {
    accounts,
    audios,
    classrooms,
    leads,
    messages,
    roles,
    sessions,
    suggestions,
  }

  const providers = {
    auth,
    gpt,
    signer,
    multimedia: Multimedia(),
    messageHandler: MessageHandler,
    storage: Storage,
  }

  const constants = {
    config,
    tempDir: resolve(__dirname, process.env.RELATIVE_TMP_DIR_PATH!),
  }

  return {
    repositories,
    providers,
    constants,
  }
}
