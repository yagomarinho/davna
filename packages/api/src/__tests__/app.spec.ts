import { Application } from '../shared/app/application'

import { routes } from '../routes'

import { InMemoryRepository } from '../shared/repositories/in.memory.repository'

import { Account } from '../modules/account/entities/account'
import { Session } from '../modules/account/entities/session'

describe('application tests', () => {
  const env = {
    repositories: {
      accounts: InMemoryRepository<Account>(),
      sessions: InMemoryRepository<Session>(),
    },
    providers: {
      signer: { sign: jest.fn(), decode: jest.fn() },
      auth: { authenticate: jest.fn(), getUser: jest.fn() },
    },
  }

  const app = Application({ routes: routes(env) }).exposeApp()

  beforeAll(async () => {
    process.env.NODE_ENV = 'production'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be able to sum 2 + 2', () => {
    expect(2 + 2).toBe(4)
  })
})
