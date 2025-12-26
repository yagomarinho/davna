/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  FederatedRepository,
  InMemoryRepository,
  STORAGE_TYPE,
} from '@davna/infra'
import { ClassroomFedRepository, ClassroomFedURI } from '../../../repositories'
import {
  Agent,
  AgentURI,
  Audio,
  AudioURI,
  Classroom,
  ClassroomURI,
  createAudio,
  createClassroom,
  createMessage,
  createOccursIn,
  createOwnership,
  createParticipant,
  createParticipation,
  createRepresentation,
  createSource,
  createText,
  Entitlement,
  EntitlementURI,
  Granted,
  GrantedURI,
  Message,
  MessageURI,
  OccursIn,
  OccursInURI,
  Ownership,
  OwnershipURI,
  Participant,
  PARTICIPANT_ROLE,
  ParticipantURI,
  Participation,
  ParticipationURI,
  PolicyAggregate,
  PolicyAggregateURI,
  Representation,
  REPRESENTATION_TYPE,
  RepresentationURI,
  Source,
  SourceURI,
  Text,
  TextURI,
  Usage,
  UsagePolicy,
  UsagePolicyURI,
  UsageURI,
} from '../../../entities'
import { IDContextFake } from './id.context.fake'

export function ClassroomFedFake(
  { IDContext } = { IDContext: IDContextFake() },
): ClassroomFedRepository {
  return FederatedRepository({
    IDContext: IDContext,
    tag: ClassroomFedURI,
    repositories: [
      init =>
        InMemoryRepository<OccursIn>({
          entityContext: init.entityContext,
          tag: OccursInURI,
        }),
      init =>
        InMemoryRepository<Ownership>({
          entityContext: init.entityContext,
          tag: OwnershipURI,
        }),
      init =>
        InMemoryRepository<Participation>({
          entityContext: init.entityContext,
          tag: ParticipationURI,
        }),
      init =>
        InMemoryRepository<Representation>({
          entityContext: init.entityContext,
          tag: RepresentationURI,
        }),
      init =>
        InMemoryRepository<Source>({
          entityContext: init.entityContext,
          tag: SourceURI,
        }),
      init =>
        InMemoryRepository<Usage>({
          entityContext: init.entityContext,
          tag: UsageURI,
        }),
      init =>
        InMemoryRepository<Granted>({
          entityContext: init.entityContext,
          tag: GrantedURI,
        }),
      init =>
        InMemoryRepository<PolicyAggregate>({
          entityContext: init.entityContext,
          tag: PolicyAggregateURI,
        }),
      init =>
        InMemoryRepository<Agent>({
          entityContext: init.entityContext,
          tag: AgentURI,
        }),
      init =>
        InMemoryRepository<Audio>({
          entityContext: init.entityContext,
          tag: AudioURI,
        }),
      init =>
        InMemoryRepository<Classroom>({
          entityContext: init.entityContext,
          tag: ClassroomURI,
        }),
      init =>
        InMemoryRepository<Message>({
          entityContext: init.entityContext,
          tag: MessageURI,
        }),
      init =>
        InMemoryRepository<Participant>({
          entityContext: init.entityContext,
          tag: ParticipantURI,
        }),
      init =>
        InMemoryRepository<Text>({
          entityContext: init.entityContext,
          tag: TextURI,
        }),
      init =>
        InMemoryRepository<Entitlement>({
          entityContext: init.entityContext,
          tag: EntitlementURI,
        }),
      init =>
        InMemoryRepository<UsagePolicy>({
          entityContext: init.entityContext,
          tag: UsagePolicyURI,
        }),
    ],
  })
}

export async function fillRepository(repo: ClassroomFedRepository) {
  const [classroom, participant] = await Promise.all([
    repo.methods.set(createClassroom({ name: 'classroom-1' })),
    repo.methods.set(
      createParticipant({ subject_id: 'subject_id', type: 'costumer' }),
    ),
  ])

  const [
    message1,
    message2,
    audio1,
    audio2,
    transcription1,
    translation1,
    transcription2,
  ] = await Promise.all([
    repo.methods.set(createMessage()),
    repo.methods.set(createMessage()),
    repo.methods.set(
      createAudio({
        status: 'persistent',
        filename: 'audio1',
        duration: 100,
        mime_type: 'audio/mp4',
        url: '',
        metadata: {},
        storage: {
          bucket: 'bucket-name',
          internal_id: 'internal_id',
          type: STORAGE_TYPE.MONGO_GRIDFS,
        },
      }),
    ),
    repo.methods.set(
      createAudio({
        status: 'persistent',
        filename: 'audio2',
        duration: 100,
        mime_type: 'audio/mp4',
        url: '',
        metadata: {},
        storage: {
          bucket: 'bucket-name',
          internal_id: 'internal_id',
          type: STORAGE_TYPE.MONGO_GRIDFS,
        },
      }),
    ),
    repo.methods.set(
      createText({
        content: 'This is transcription of audio1',
        metadata: {},
      }),
    ),
    repo.methods.set(
      createText({
        content: 'This is translation of audio1',
        metadata: {},
      }),
    ),
    repo.methods.set(
      createText({
        content: 'This is transcription of audio2',
        metadata: {},
      }),
    ),
    repo.methods.set(
      createParticipation({
        participant_role: PARTICIPANT_ROLE.STUDENT,
        source_id: participant.meta.id,
        target_id: classroom.meta.id,
      }),
    ),
    repo.methods.set(
      createOwnership({
        source_id: participant.meta.id,
        target_id: classroom.meta.id,
        target_type: ClassroomURI,
      }),
    ),
  ])

  await Promise.all([
    repo.methods.set(
      createOccursIn({
        source_id: message1.meta.id,
        target_id: classroom.meta.id,
      }),
    ),
    repo.methods.set(
      createOccursIn({
        source_id: message2.meta.id,
        target_id: classroom.meta.id,
      }),
    ),
    repo.methods.set(
      createSource({
        source_id: audio1.meta.id,
        target_id: message1.meta.id,
        source_type: AudioURI,
      }),
    ),
    repo.methods.set(
      createSource({
        source_id: audio2.meta.id,
        target_id: message2.meta.id,
        source_type: AudioURI,
      }),
    ),
    repo.methods.set(
      createOwnership({
        source_id: participant.meta.id,
        target_id: message1.meta.id,
        target_type: MessageURI,
      }),
    ),
    repo.methods.set(
      createOwnership({
        source_id: participant.meta.id,
        target_id: message2.meta.id,
        target_type: MessageURI,
      }),
    ),
    repo.methods.set(
      createOwnership({
        source_id: participant.meta.id,
        target_id: audio1.meta.id,
        target_type: AudioURI,
      }),
    ),
    repo.methods.set(
      createOwnership({
        source_id: participant.meta.id,
        target_id: audio2.meta.id,
        target_type: AudioURI,
      }),
    ),
    repo.methods.set(
      createRepresentation({
        target_type: AudioURI,
        target_id: audio1.meta.id,
        source_id: transcription1.meta.id,
        type: REPRESENTATION_TYPE.TRANSCRIPTION,
      }),
    ),
    repo.methods.set(
      createRepresentation({
        target_type: AudioURI,
        target_id: audio1.meta.id,
        source_id: translation1.meta.id,
        type: REPRESENTATION_TYPE.TRANSLATION,
      }),
    ),
    repo.methods.set(
      createRepresentation({
        target_type: AudioURI,
        target_id: audio2.meta.id,
        source_id: transcription2.meta.id,
        type: REPRESENTATION_TYPE.TRANSCRIPTION,
      }),
    ),
  ])
}
