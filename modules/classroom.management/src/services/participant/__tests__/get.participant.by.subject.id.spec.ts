import { isLeft, isRight } from '@davna/core'

import { getParticipantBySubjectId } from '../get.participant.by.subject.id'
import { ParticipantURI } from '../../../entities'

describe('get participant by subject id service', () => {
  const repository = {
    methods: {
      query: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be able to get participant by subject id', async () => {
    const subject_id = 'subject-1'

    const participant = {
      _t: ParticipantURI,
      meta: {
        id: 'participant-1',
      },
      props: {
        subject_id,
      },
    }

    repository.methods.query.mockResolvedValue({
      data: [participant],
    })

    const result = await getParticipantBySubjectId({ subject_id })({
      repository: repository as any,
    })

    expect(isRight(result)).toBeTruthy()

    expect(result.value).toEqual(participant)
  })

  it('should not be able to get participant when subject id is not found', async () => {
    const subject_id = 'subject-1'

    repository.methods.query.mockResolvedValue({
      data: [],
    })

    const result = await getParticipantBySubjectId({ subject_id })({
      repository: repository as any,
    })

    expect(isLeft(result)).toBeTruthy()
  })
})
