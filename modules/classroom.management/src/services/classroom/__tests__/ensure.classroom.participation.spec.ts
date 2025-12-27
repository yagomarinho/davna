import { isLeft, isRight } from '@davna/core'

import { ensureClassroomParticipation } from '../ensure.classroom.participation'
import {
  ClassroomURI,
  ParticipantURI,
  ParticipationURI,
} from '../../../entities'

describe('ensure classroom participation service', () => {
  const repository = {
    methods: {
      query: jest.fn(),
      get: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be able to ensure participation when subject is participant and has participation in classroom', async () => {
    const participant_id = 'participant-1'
    const classroom_id = 'classroom-1'

    const participant = {
      _t: ParticipantURI,
      meta: {
        id: participant_id,
      },
    }

    const classroom = {
      _t: ClassroomURI,
      meta: {
        id: classroom_id,
      },
    }

    const participation = {
      _t: ParticipationURI,
      meta: {
        id: 'participation-1',
      },
    }

    repository.methods.query.mockResolvedValueOnce({ data: [participation] })

    repository.methods.get
      .mockResolvedValueOnce(participant)
      .mockResolvedValueOnce(classroom)

    const result = await ensureClassroomParticipation({
      participant_id,
      classroom_id,
    })({
      repository: repository as any,
    })

    expect(isRight(result)).toBeTruthy()
  })

  it('should not be able to ensure participation when has not a participant', async () => {
    const participant_id = 'participant-1'
    const classroom_id = 'classroom-1'

    repository.methods.query.mockResolvedValueOnce({ data: [] })
    repository.methods.get
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        _t: ClassroomURI,
        meta: { id: classroom_id },
      })

    const result = await ensureClassroomParticipation({
      participant_id,
      classroom_id,
    })({
      repository: repository as any,
    })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not be able to ensure participation when classroom does not exist', async () => {
    const participant_id = 'participant-1'
    const classroom_id = 'classroom-1'

    const participant = {
      _t: ParticipantURI,
      meta: {
        id: 'participant-1',
      },
    }

    repository.methods.query.mockResolvedValueOnce({ data: [] })
    repository.methods.get
      .mockResolvedValueOnce(participant)
      .mockResolvedValueOnce(undefined)

    const result = await ensureClassroomParticipation({
      participant_id,
      classroom_id,
    })({
      repository: repository as any,
    })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not be able to ensure participation when participant has no participation with classroom', async () => {
    const participant_id = 'participant-1'
    const classroom_id = 'classroom-1'

    const participant = {
      _t: ParticipantURI,
      meta: {
        id: 'participant-1',
      },
    }

    const classroom = {
      _t: ClassroomURI,
      meta: {
        id: classroom_id,
      },
    }

    repository.methods.query.mockResolvedValueOnce({ data: [] })

    repository.methods.get
      .mockResolvedValueOnce(participant)
      .mockResolvedValue(classroom)

    const result = await ensureClassroomParticipation({
      participant_id,
      classroom_id,
    })({
      repository: repository as any,
    })

    expect(isLeft(result)).toBeTruthy()
  })
})
