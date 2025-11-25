import { MongoClient } from 'mongodb'

import { AccountRepository } from './modules/account/repositories/account.repository'
import { SessionRepository } from './modules/account/repositories/session.repository'
import { ClassroomRepository } from './modules/classroom/repositories/classroom.repository'
import { MessageRepository } from './modules/classroom/repositories/message.repository'

import { Auth } from './modules/account/helpers/auth'
import { Signer } from './modules/account/helpers/signer'
import { Repository, Writable } from './shared/core/repository'
import { Account } from './modules/account/entities/account'
import { Session } from './modules/account/entities/session'

import config from './config'
import { Classroom } from './modules/classroom/entities/classroom'
import { Message } from './modules/classroom/entities/message'
import { MessageHandler } from './modules/classroom/providers/message.handler'
import { AudioRepository } from './modules/classroom/repositories/audio.repository'
import { Audio } from './modules/classroom/entities/audio'
import { Storage, StorageConstructor } from './shared/providers/storage/storage'
import { Lead } from './modules/lead/entities/lead'
import { LeadRepository } from './modules/lead/repositories/lead.repository'

export interface Env {
  repositories: {
    accounts: Repository<Account>
    audios: Repository<Audio>
    classrooms: Repository<Classroom>
    leads: Writable<Repository<Lead>>
    messages: Repository<Message>
    sessions: Repository<Session>
  }
  providers: {
    auth: Auth
    signer: Signer
    messageHandler: MessageHandler
    storage: StorageConstructor
  }
}

export const Env = async (): Promise<Env> => {
  const auth = Auth()
  const signer = Signer({
    secret: config.auth.jwt.secret,
  })

  const client = new MongoClient(config.databases.default_uri)

  const accounts = AccountRepository({ client })
  const audios = AudioRepository({ client })
  const classrooms = ClassroomRepository({ client })
  const messages = MessageRepository({ client })
  const sessions = SessionRepository({ client })

  const leads = LeadRepository()

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
  }

  const providers = {
    auth,
    signer,
    messageHandler: MessageHandler,
    storage: Storage,
  }

  return {
    repositories,
    providers,
  }
}
