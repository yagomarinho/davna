import { Identifier } from '@davna/core'

export interface User extends Identifier {
  name: string
}

export interface Auth {
  authenticate: (email: string, password: string) => Promise<User>
  getUser: (id: string) => Promise<User>
}
