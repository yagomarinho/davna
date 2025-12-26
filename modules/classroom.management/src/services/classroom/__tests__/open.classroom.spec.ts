import { isRight } from '@davna/core'

import { openClassroom } from '../../classroom/open.classroom'
import {
  Classroom,
  createAgent,
  createParticipant,
  Ownership,
  Participant,
} from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from './fakes/classroom.fed.fake'
import { IDContextFake } from './fakes/id.context.fake'
import { IDContext } from '@davna/infra'

describe('open classroom service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(async () => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })

    jest.clearAllMocks()
  }, 3_000)

  it('should return Right with a classroom containing teacher and student participants and consume from verifyConsume', async () => {
    const [owner, agent] = await Promise.all([
      repository.methods.set(
        createParticipant({ subject_id: 'subject_id', type: 'costumer' }),
      ),
      repository.methods.set(createAgent({ name: 'Agent' })),
    ])

    const agentParticipant = await repository.methods.set(
      createParticipant({ subject_id: agent.meta.id, type: 'agent' }),
    )

    const result = await openClassroom({
      owner_id: owner.meta.id,
      participant_ids: [agentParticipant.meta.id],
    })({
      repository,
    })

    expect(isRight(result)).toBeTruthy()
    const { classroom, participants, ownership } = (result as any).value as {
      classroom: Classroom
      participants: Participant[]
      ownership: Ownership
    }

    expect(participants).toEqual([agentParticipant, owner])
    expect(classroom.meta.id).toEqual(expect.any(String))
    expect(ownership).toEqual(
      expect.objectContaining({
        props: expect.objectContaining({
          source_id: owner.meta.id,
          target_id: classroom.meta.id,
        }),
      }),
    )
  })

  it('should persist and generate unique classrooms for different participants', async () => {
    const [alice, bob, agent] = await Promise.all([
      repository.methods.set(
        createParticipant({ subject_id: 'alice', type: 'costumer' }),
      ),
      repository.methods.set(
        createParticipant({ subject_id: 'bob', type: 'costumer' }),
      ),
      repository.methods.set(createAgent({ name: 'Any Agent' })),
    ])

    const agentParticipant = await repository.methods.set(
      createParticipant({ subject_id: agent.meta.id, type: 'agent' }),
    )

    const r1 = await openClassroom({
      owner_id: alice.meta.id,
      participant_ids: [agentParticipant.meta.id],
    })({ repository })
    const r2 = await openClassroom({
      owner_id: bob.meta.id,
      participant_ids: [agentParticipant.meta.id],
    })({ repository })

    expect(isRight(r1)).toBeTruthy()
    expect(isRight(r2)).toBeTruthy()

    const c1 = (r1 as any).value.classroom as Classroom
    const c1Participants = (r1 as any).value.participants as Classroom
    const c2 = (r2 as any).value.classroom as Classroom
    const c2Participants = (r2 as any).value.participants as Classroom

    expect(c1).not.toBe(c2)
    if ((c1 as any).meta.id && (c2 as any).meta.id) {
      expect((c1 as any).meta.id).not.toEqual((c2 as any).meta.id)
    }

    expect(c1Participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          props: expect.objectContaining({ subject_id: 'alice' }),
        }),
      ]),
    )

    expect(c2Participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          props: expect.objectContaining({ subject_id: 'bob' }),
        }),
      ]),
    )
  })
})
