import { resolve } from 'node:path'
import {
  Auth,
  ChatGPT,
  FakeAI,
  FirebaseAdminAuth,
  GPTModel,
  JWTSigner,
  Signer,
} from '@davna/providers'
import { Repository, Writable } from '@davna/core'
import { MongoClient } from '@davna/repositories'

import {
  Account,
  AccountRepository,
  Session,
  SessionRepository,
} from '@davna/account'
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
import { Multimedia } from './multimedia'

import { Config } from '../config'

export interface Env {
  repositories: {
    accounts: Repository<Account>
    audios: Repository<Audio>
    classrooms: Repository<Classroom>
    leads: Writable<Repository<Lead>>
    messages: Repository<Message>
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
    sessions.connect(),
  ])

  const repositories = {
    accounts,
    audios,
    classrooms,
    leads,
    messages,
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
