import { isRight } from '@davna/core'

import { createParticipantForSubject } from '../create.participant.for.subject'
import { Participant, ParticipantProps } from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContextFake } from '../../__fakes__/id.context.fake'
import { IDContext } from '@davna/infra'

describe('create participant for subject service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(async () => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })

    jest.clearAllMocks()
  })

  it('should be able to create a participant for a given subject', async () => {
    const subject_id = 'subject-1'
    const type: ParticipantProps['type'] = 'costumer'

    const result = await createParticipantForSubject({
      subject_id,
      type,
    })({ repository })

    expect(isRight(result)).toBeTruthy()

    const participant = result.value as Participant

    expect(participant).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          subject_id,
          type,
        }),
        meta: expect.objectContaining({
          id: expect.any(String),
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        }),
      }),
    )

    const { data: all } = await repository.methods.query()

    expect(all.length).toBe(1)
  })
})
