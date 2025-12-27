import { isLeft, isRight } from '@davna/core'

import { getParticipant } from '../get.participant'
import { ParticipantURI } from '../../../entities'

describe('get participant service', () => {
  const repository = {
    methods: {
      get: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be able to get participant by id', async () => {
    const participant_id = 'participant-1'

    const participant = {
      _t: ParticipantURI,
      meta: {
        id: participant_id,
      },
      props: {},
    }

    repository.methods.get.mockResolvedValue(participant)

    const result = await getParticipant({ participant_id })({
      repository: repository as any,
    })

    expect(isRight(result)).toBeTruthy()
    expect(result.value).toEqual(participant)
  })

  it('should not be able to get participant when it does not exist', async () => {
    const participant_id = 'participant-1'

    repository.methods.get.mockResolvedValue(null)

    const result = await getParticipant({ participant_id })({
      repository: repository as any,
    })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not be able to get participant when entity is not a participant', async () => {
    const participant_id = 'participant-1'

    repository.methods.get.mockResolvedValue({
      _t: 'other-entity',
      meta: { id: participant_id },
    })

    const result = await getParticipant({ participant_id })({
      repository: repository as any,
    })

    expect(isLeft(result)).toBeTruthy()
  })
})
