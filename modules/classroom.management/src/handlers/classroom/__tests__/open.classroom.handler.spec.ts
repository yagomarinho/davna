import {
  AuthContext,
  createAuthContext,
  createMeta,
  Left,
  Request,
  Right,
} from '@davna/core'

import { openClassroom, getParticipantBySubjectId } from '../../../services'

import { openClassroomHandler } from '../open.classroom.handler'
import { createParticipant, ParticipantURI } from '../../../entities'

jest.mock('../../../services')

describe('open classroom handler', () => {
  const repository = {
    methods: {},
  }

  const account = {
    id: 'account-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function authContext(subject_id: string): AuthContext {
    return createAuthContext({ id: subject_id })
  }

  it('should be able to open a classroom when agent is a valid participant', async () => {
    const agent_id = 'participant-1'

    const participant = {
      _t: ParticipantURI,
      meta: {
        id: agent_id,
      },
    }

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve({
        _tag: 'Right',
        value: participant,
      }),
    )

    const classroom = {
      meta: { id: 'classroom-1' },
    }

    ;(openClassroom as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve({
        _tag: 'Right',
        value: { classroom },
      }),
    )

    const result = await openClassroomHandler(
      Request({
        data: { agent_id: agent_id },
        metadata: { auth: authContext(account.id) },
      }),
    )({ repository } as any)

    expect(result.data).toEqual({ classroom })
  })

  it('should not be able to open a classroom when agent id is invalid', async () => {
    const agent_id = 'invalid-participant'

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Invalid participant id',
        }),
      ),
    )

    const result = await openClassroomHandler(
      Request({
        data: { agent_id },
        metadata: { auth: authContext(account.id) },
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({
      message: `Invalid agent id: ${agent_id}`,
    })
  })

  it('should rollback and return error when open classroom fails', async () => {
    const agent_id = 'participant-1'

    const participant = createParticipant(
      { subject_id: 'subject_id', type: 'agent' },
      createMeta({
        id: agent_id,
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(openClassroom as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Left({ status: 'error', message: 'Invalid classroom' })),
    )

    const result = await openClassroomHandler(
      Request({
        data: { agent_id },
        metadata: { auth: authContext(account.id) },
      }),
    )({ repository } as any)

    expect(result.metadata?.headers.status).toBe(400)
  })
})
