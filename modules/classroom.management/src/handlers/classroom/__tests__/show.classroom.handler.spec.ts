import { Left, Request, Right } from '@davna/core'
import { classroomDTOfromGraph } from '../../../dtos'
import { ClassroomURI, ParticipantURI } from '../../../entities'
import { showClassroom } from '../../../services/classroom/show.classroom'
import { getParticipantBySubjectId } from '../../../services/participant/get.participant.by.subject.id'
import { showClassroomHandler } from '../show.classroom.handler'

jest.mock('../../../services/participant/get.participant.by.subject.id')
jest.mock('../../../services/classroom/show.classroom')
jest.mock('../../../dtos')

describe('show classroom handler', () => {
  const repository = {
    methods: {},
  }

  const account = {
    id: 'subject-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be able to show classroom when subject is authorized participant', async () => {
    const classroom_id = 'classroom-1'

    const participant = {
      _t: ParticipantURI,
      meta: { id: 'participant-1' },
    }

    const classroom = {
      _t: ClassroomURI,
      meta: { id: classroom_id },
    }

    const classroomOwnership = { id: 'ownership-1' }
    const participations = [{ id: 'participation-1' }]

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(showClassroom as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          classroom,
          classroomOwnership,
          participations,
        }),
      ),
    )
    ;(classroomDTOfromGraph as jest.Mock).mockReturnValue({
      id: classroom_id,
    })

    const result = await showClassroomHandler(
      Request({
        data: { classroom_id },
        metadata: { account },
      }),
    )({ repository } as any)

    expect(result.data).toEqual({
      classroom: { id: classroom_id },
    })
  })

  it('should return 400 when participant is not found', async () => {
    const classroom_id = 'classroom-1'

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({ status: 'error', message: 'Participant not found' }),
      ),
    )

    const result = await showClassroomHandler(
      Request({
        data: { classroom_id },
        metadata: { account },
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({
      message: 'Participant not found',
    })
  })

  it('should return 400 when classroom is not authorized or not found', async () => {
    const classroom_id = 'classroom-1'

    const participant = {
      _t: ParticipantURI,
      meta: { id: 'participant-1' },
    }

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(showClassroom as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Left({
          status: 'error',
          message: 'Not authorized to show this classroom',
        }),
      ),
    )

    const result = await showClassroomHandler(
      Request({
        data: { classroom_id },
        metadata: { account },
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({
      message: 'Not authorized to show this classroom',
    })
  })
})
