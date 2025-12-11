import { createServer, type Server } from 'node:http'
import { io, type Socket } from 'socket.io-client'

import request from 'supertest'

import { Classroom, Message } from '@davna/classroom'

import { App, createWsServer } from '../app'
import { makeEnv } from './fakes/env'
import { bearer } from './utils/bearer'
import { connect } from './utils/connect'
import { waitFor } from './utils/wait.for'
import { Role } from '@davna/role'

type Token = {
  value: string
  expiresIn: number
}

type Account = {
  roles: string[]
}

type Session = {
  token: Token
  refresh_token: Token
  account: Account
}

interface ClassStarted {
  classroom: Classroom
  remainingConsumption: number
}

interface ClassUpdated extends ClassStarted {
  message: Message
}

// Utilizar em breve

// interface ClassReplying {
//   classroom_id: string
//   participant_id: string
// }

describe('application integration tests', () => {
  const credentials = { email: 'john@example.com', password: '123456' }

  const env = makeEnv()
  const API_KEY_HEADER_NAME = env.constants.config.auth.apiKey.headerName
  const API_KEY_TOKEN = `apikey=${env.constants.config.auth.apiKey.key}`
  const SESSION_TOKEN_HEADER_NAME =
    env.constants.config.auth.jwt.token.headerName
  const SESSION_REFRESH_TOKEN_HEADER_NAME =
    env.constants.config.auth.jwt.refresh_token.headerName

  let app: any
  let session: Session
  let audio: { id: string }
  let server: Server
  let socket: Socket
  let classroom: Classroom

  beforeAll(async () => {
    const port = 3333
    const a = App({ env, port })

    a.mount()

    app = a.exposeApp()
    server = createWsServer(createServer(app), env)

    const sessionRes = await request(app)
      .post('/session')
      .send(credentials)
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)

    const ses = sessionRes.body

    connect({ server, port })

    const classroomRes = await request(app)
      .post('/classroom')
      .send(credentials)
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(SESSION_TOKEN_HEADER_NAME, bearer(ses.token.value))

    classroom = classroomRes.body.classroom

    socket = io(`http://localhost:${port}`, {
      path: '/socket.io',
      reconnectionAttempts: 2,
      auth: {
        token: ses.token.value,
        classroom_id: classroom.id,
      },
      autoConnect: true,
      timeout: 5_000,
    })

    socket.on('connect_error', (err: any) => {
      throw new Error(err)
    })

    socket.on('connect_timeout', (t: any) => {
      throw new Error(t)
    })

    socket.on('error:internal', t => {
      throw new Error(t)
    })

    socket.on('error', (err: any) => {
      throw new Error(err)
    })

    socket.on('connect', () => {
      socket.emit('classroom:welcome')
    })

    const [started] = await Promise.all([
      waitFor<ClassStarted>(socket, 'classroom:started'),
      waitFor<ClassStarted>(socket, 'classroom:replying'),
      waitFor(socket, 'classroom:updated'),
    ])

    expect(started.classroom).toEqual(
      expect.objectContaining({
        id: classroom.id,
        owner_id: classroom.owner_id,
        participants: classroom.participants,
        created_at: classroom.created_at,
        updated_at: classroom.updated_at,
      }),
    )
  }, 20_000)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('health check service', async () => {
    const res = await request(app).get('/health').expect(200)
    expect(res.body.healthy).toBeTruthy()
  })

  test('post lead service', async () => {
    const lead = { lead: '(21) 988776655' }
    const res = await request(app)
      .post('/feedback/lead')
      .send(lead)
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .expect(200)

    expect(res.body.id).toBe('21988776655')
  })

  test('create session service', async () => {
    const adminRole = await env.repositories.roles.set(
      Role.create({ name: 'ADMIN', description: 'Admin Role' }),
    )

    const [account] = await env.repositories.accounts.query()

    await env.repositories.accounts.set({
      ...account,
      roles: [adminRole.id],
    })

    const res = await request(app)
      .post('/session')
      .send(credentials)
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .expect(200)

    session = res.body

    expect(session).toEqual({
      account: expect.objectContaining({
        roles: ['ADMIN'],
      }),
      token: {
        value: expect.any(String),
        expiresIn: expect.any(Number),
      },
      refresh_token: {
        value: expect.any(String),
        expiresIn: expect.any(Number),
      },
    })
  })

  test('not authorized to create a session', async () => {
    await request(app)
      .post('/session')
      .send({ email: 'john@example.com', password: '12345' })
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .expect(401)
  })

  test('verify session service', async () => {
    const query = new URLSearchParams()
    query.append('refreshStrategy', 'never')

    const res = await request(app)
      .get(`/session?${query.toString()}`)
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(SESSION_TOKEN_HEADER_NAME, bearer(session.token.value))
      .expect(200)

    expect(res.body).toEqual(
      expect.objectContaining({
        token: expect.objectContaining({ value: session.token.value }),
        refresh_token: expect.objectContaining({
          value: session.refresh_token.value,
        }),
      }),
    )
  })

  test('refresh token service', async () => {
    const res = await request(app)
      .get('/session/refresh')
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(
        SESSION_REFRESH_TOKEN_HEADER_NAME,
        bearer(session.refresh_token.value),
      )
      .expect(200)

    expect(res.body).not.toEqual(
      expect.objectContaining({
        token: expect.objectContaining({ value: session.token.value }),
        refresh_token: expect.objectContaining({
          value: session.refresh_token.value,
        }),
      }),
    )

    session = res.body
  })

  test('upload audio service', async () => {
    const buf = Buffer.from('buffer represents an audio')

    const res = await request(app)
      .post('/audio')
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(SESSION_TOKEN_HEADER_NAME, bearer(session.token.value))
      .attach('file', buf, {
        filename: 'audiotest',
        contentType: 'audio/mp4',
      })
      .expect(200)

    audio = res.body

    expect(audio).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        owner_id: expect.any(String),
        name: 'audiotest',
        mime: 'audio/mp4',
        src: expect.any(String),
        internal_ref: {
          identifier: expect.any(String),
          storage: expect.any(String),
        },
        duration: expect.any(Number),
      }),
    )
  })

  test('download audio service', async () => {
    const res = await request(app)
      .get(`/audio/${audio.id}`)
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(SESSION_TOKEN_HEADER_NAME, bearer(session.token.value))
      .expect(200)

    const mime = res.headers['content-type']
    expect(mime).toBe('audio/mp4')
  })

  test('not found audio with invalid id service', async () => {
    await request(app)
      .get(`/audio/notfound`)
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(SESSION_TOKEN_HEADER_NAME, bearer(session.token.value))
      .expect(404)
  })

  test('post suggestion service', async () => {
    const suggestion = { suggestion: 'This is a suggestion' }
    const res = await request(app)
      .post('/feedback/suggestion')
      .send(suggestion)
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(SESSION_TOKEN_HEADER_NAME, bearer(session.token.value))
      .expect(200)

    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        suggestion: 'This is a suggestion',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }),
    )
  })

  test('append message and receive reply: WS', async () => {
    socket.emit('classroom:append-message', {
      classroom_id: classroom.id,
      type: 'audio',
      data: audio,
    })

    const append = await waitFor<ClassUpdated>(socket, 'classroom:updated')
    const agent = await waitFor<ClassUpdated>(socket, 'classroom:updated')

    expect(append.classroom.id).toBe(classroom.id)
    expect(append.message.participant_id).toBe('0')
    expect(append.message.data).toEqual(audio)

    expect(agent.classroom.id).toBe(classroom.id)
    expect(agent.message.participant_id).toBe('agent')
  }, 20_000)

  test('revoke session service', async () => {
    await request(app)
      .delete('/session')
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(SESSION_TOKEN_HEADER_NAME, bearer(session.token.value))
      .expect(204)

    await request(app)
      .get('/session')
      .set(API_KEY_HEADER_NAME, API_KEY_TOKEN)
      .set(SESSION_TOKEN_HEADER_NAME, bearer(session.token.value))
      .expect(401)
  })
  afterAll(() => {
    socket.disconnect()
    server.close()
  })
})
