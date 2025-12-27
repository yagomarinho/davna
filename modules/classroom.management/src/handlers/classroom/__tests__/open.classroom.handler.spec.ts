import { Request } from '@davna/core'

import { openClassroomHandler } from '../open.classroom.handler'
import { ParticipantURI } from '../../../entities'
import { getParticipant } from '../../../services/participant/get.participant'
import { openClassroom } from '../../../services/classroom/open.classroom'

jest.mock('../../services/get.participant')
jest.mock('../../services/open.classroom')

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

  it('should be able to open a classroom when agent is a valid participant', async () => {
    const agent_id = 'participant-1'

    const participant = {
      _t: ParticipantURI,
      meta: {
        id: agent_id,
      },
    }

    ;(getParticipant as any as jest.Mock).mockReturnValue(() =>
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
      Request.metadata({
        account,
        agent_id,
      }),
    )({ repository } as any)

    expect(result.data).toEqual({ classroom })
  })

  it('should not be able to open a classroom when agent id is invalid', async () => {
    const agent_id = 'invalid-participant'

    ;(getParticipant as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve({
        _tag: 'Left',
      }),
    )

    const result = await openClassroomHandler(
      Request.metadata({
        account,
        agent_id,
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({
      message: `Invalid agent id: ${agent_id}`,
    })
  })

  it('should rollback and return error when open classroom fails', async () => {
    const agent_id = 'participant-1'

    const participant = {
      _t: ParticipantURI,
      meta: {
        id: agent_id,
      },
    }

    ;(getParticipant as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve({
        _tag: 'Right',
        value: participant,
      }),
    )
    ;(openClassroom as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve({
        _tag: 'Left',
      }),
    )

    const result = await openClassroomHandler(
      Request.metadata({
        account,
        agent_id,
      }),
    )({ repository } as any)

    expect(result.metadata?.status).toBe('error')
  })
})
