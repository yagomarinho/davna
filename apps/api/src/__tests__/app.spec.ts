import { routes } from '../routes'

import { Account } from '../../../../modules/account/src/entities/account'
import { Session } from '../../../../modules/account/src/entities/session'
import { InMemoryRepository } from '@davna/repositories'
import { Application } from '@davna/applications'

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

  const app = Application({ routes: routes(env), port: 3333 }).exposeApp()

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
