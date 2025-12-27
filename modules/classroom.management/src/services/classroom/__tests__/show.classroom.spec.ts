import { isLeft, isRight } from '@davna/core'

import { showClassroom } from '../show.classroom'
import {
  Classroom,
  ClassroomURI,
  Ownership,
  PARTICIPANT_ROLE,
  Participant,
  Participation,
  createClassroom,
  createOwnership,
  createParticipant,
  createParticipation,
} from '../../../entities'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../__fakes__/classroom.fed.fake'
import { IDContextFake } from '../../__fakes__/id.context.fake'
import { IDContext } from '@davna/infra'

describe('show classroom service', () => {
  let repository: ClassroomFedRepository
  let IDContext: IDContext

  beforeEach(async () => {
    IDContext = IDContextFake()
    repository = ClassroomFedFake({ IDContext })

    jest.clearAllMocks()
  })

  it('should be able to show a classroom when participant is authorized', async () => {
    const owner = await repository.methods.set(
      createParticipant({ subject_id: 'owner', type: 'costumer' }),
    )

    const viewer = await repository.methods.set(
      createParticipant({ subject_id: 'viewer', type: 'costumer' }),
    )

    const classroom = await repository.methods.set(
      createClassroom({ name: 'classroom' }),
    )

    const ownership = await repository.methods.set(
      createOwnership({
        source_id: owner.meta.id,
        target_id: classroom.meta.id,
        target_type: ClassroomURI,
      }),
    )

    const participationOwner = await repository.methods.set(
      createParticipation({
        source_id: owner.meta.id,
        target_id: classroom.meta.id,
        participant_role: PARTICIPANT_ROLE.STUDENT,
      }),
    )

    const participationViewer = await repository.methods.set(
      createParticipation({
        source_id: viewer.meta.id,
        target_id: classroom.meta.id,
        participant_role: PARTICIPANT_ROLE.STUDENT,
      }),
    )

    const result = await showClassroom({
      classroom_id: classroom.meta.id,
      participant_id: viewer.meta.id,
    })({ repository })

    expect(isRight(result)).toBeTruthy()

    const value = (result as any).value as {
      classroom: Classroom
      classroomOwnership: Ownership
      participants: Participant[]
      participations: Participation[]
    }

    expect(value.classroom).toEqual(classroom)
    expect(value.classroomOwnership).toEqual(ownership)

    expect(value.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          meta: expect.objectContaining({ id: owner.meta.id }),
        }),
        expect.objectContaining({
          meta: expect.objectContaining({ id: viewer.meta.id }),
        }),
      ]),
    )

    expect(value.participations).toEqual(
      expect.arrayContaining([participationOwner, participationViewer]),
    )
  })

  it('should not be able to show classroom when classroom does not exist', async () => {
    const participant = await repository.methods.set(
      createParticipant({ subject_id: 'any', type: 'costumer' }),
    )

    const result = await showClassroom({
      classroom_id: 'invalid-classroom',
      participant_id: participant.meta.id,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
  })

  it('should not be able to show classroom when participant has no participation', async () => {
    const owner = await repository.methods.set(
      createParticipant({ subject_id: 'owner', type: 'costumer' }),
    )

    const outsider = await repository.methods.set(
      createParticipant({ subject_id: 'outsider', type: 'costumer' }),
    )

    const classroom = await repository.methods.set(
      createClassroom({ name: 'classroom' }),
    )

    await repository.methods.set(
      createOwnership({
        source_id: owner.meta.id,
        target_id: classroom.meta.id,
        target_type: ClassroomURI,
      }),
    )

    await repository.methods.set(
      createParticipation({
        source_id: owner.meta.id,
        target_id: classroom.meta.id,
        participant_role: PARTICIPANT_ROLE.STUDENT,
      }),
    )

    const result = await showClassroom({
      classroom_id: classroom.meta.id,
      participant_id: outsider.meta.id,
    })({ repository })

    expect(isLeft(result)).toBeTruthy()
  })
})
