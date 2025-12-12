import { isLeft, isRight } from '@davna/core'
import { loginValidation } from '../login.dto'

describe('loginValidation', () => {
  it('should validate successfully and apply default user-agent', async () => {
    const request: any = {
      metadata: {},
      data: {
        email: 'test@example.com',
        password: 'secret',
      },
    }

    const result = await loginValidation(request)

    expect(isRight(result)).toBeTruthy()

    const serialized = JSON.stringify(result)

    expect(serialized).toContain('"user-agent":"anonymous"')
    expect(serialized).toContain('"email":"test@example.com"')
    expect(serialized).toContain('"password":"secret"')
  })

  it('should keep given user-agent when provided', async () => {
    const request: any = {
      metadata: { headers: { 'user-agent': 'custom-agent' } },
      data: {
        email: 'john@doe.com',
        password: '123456',
      },
    }

    const result = await loginValidation(request)

    expect(isRight(result)).toBeTruthy()

    const serialized = JSON.stringify(result)

    expect(serialized).toContain('"user-agent":"custom-agent"')
  })

  it('should return Left when email is invalid', async () => {
    const request: any = {
      metadata: {},
      data: {
        email: 'invalid-email',
        password: 'abc',
      },
    }

    const result = await loginValidation(request)

    expect(isLeft(result)).toBeTruthy()

    expect(JSON.stringify(result)).toContain('email')
  })

  it('should return Left when password is missing', async () => {
    const request: any = {
      metadata: {},
      data: {
        email: 'test@example.com',
      },
    }

    const result = await loginValidation(request)

    expect(isLeft(result)).toBeTruthy()

    expect(JSON.stringify(result)).toContain('password')
  })

  it('should return Left when data is missing entirely', async () => {
    const request: any = {
      metadata: {},
    }

    const result = await loginValidation(request)

    expect(isLeft(result)).toBeTruthy()

    expect(JSON.stringify(result)).toContain('email')
    expect(JSON.stringify(result)).toContain('password')
  })
})
