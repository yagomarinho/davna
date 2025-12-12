import { Auth } from '@davna/providers'

export function makeAuth(): Auth {
  const getUser: Auth['getUser'] = async id => {
    if (id === '1') return { id: '1', name: 'John' }
    throw new Error('invalid id')
  }

  const authenticate: Auth['authenticate'] = async (email, password) => {
    if (email === 'john@example.com' && password === '123456')
      return getUser('1')
    throw new Error('Invalid Credentials')
  }

  return {
    authenticate,
    getUser,
  }
}
