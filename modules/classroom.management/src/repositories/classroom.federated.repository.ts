/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FederatedRepository, IDContext, MongoRepository } from '@davna/infra'
import {
  Agent,
  AgentRepository,
  Audio,
  AudioRepository,
  Classroom,
  ClassroomRepository,
  Message,
  MessageRepository,
  OccursIn,
  OccursInRepository,
  Ownership,
  OwnershipRepository,
  Participant,
  ParticipantRepository,
  Participation,
  ParticipationRepository,
  Representation,
  RepresentationRepository,
  Source,
  SourceRepository,
  Text,
  TextRepository,
  Usage,
  UsageRepository,
} from '../entities'

export const ClassroomFedURI = 'classroom.fed'
export type ClassroomFedURI = typeof ClassroomFedURI

type Edges =
  | OccursIn
  | Ownership
  | Participation
  | Representation
  | Source
  | Usage
type Vertices = Agent | Audio | Classroom | Message | Participant | Text

export interface ClassroomFedRepository extends FederatedRepository<
  Edges | Vertices,
  ClassroomFedURI
> {}

type Client = ReturnType<MongoRepository<any>['infra']['createClient']>

export interface Config {
  IDContext: IDContext
  client?: Client
}

export const ClassroomFedRepository = ({
  IDContext,
  client,
}: Config): ClassroomFedRepository =>
  FederatedRepository({
    IDContext,
    tag: ClassroomFedURI,
    repositories: [
      init => OccursInRepository({ client, entityContext: init.entityContext }),
      init =>
        OwnershipRepository({ client, entityContext: init.entityContext }),
      init =>
        ParticipationRepository({
          client,
          entityContext: init.entityContext,
        }),
      init =>
        RepresentationRepository({
          client,
          entityContext: init.entityContext,
        }),
      init =>
        SourceRepository({
          client,
          entityContext: init.entityContext,
        }),
      init =>
        UsageRepository({
          client,
          entityContext: init.entityContext,
        }),
      init => AgentRepository({ client, entityContext: init.entityContext }),
      init => AudioRepository({ client, entityContext: init.entityContext }),
      init =>
        ClassroomRepository({ client, entityContext: init.entityContext }),
      init => MessageRepository({ client, entityContext: init.entityContext }),
      init =>
        ParticipantRepository({ client, entityContext: init.entityContext }),
      init => TextRepository({ client, entityContext: init.entityContext }),
    ],
  })
