/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Filter, isLeft, Left, QueryBuilder, Right, Service } from '@davna/core'

import { ClassroomFedRepository } from '../../repositories'

import {
  Classroom,
  createMessage,
  createOccursIn,
  createOwnership,
  createSource,
  Message,
  MessageURI,
  OccursIn,
  Ownership,
  Participation,
  Source,
} from '../../entities'
import {
  MapperInit,
  Resource,
  resourceResolver,
} from '../../utils/resource.resolver'

interface Request {
  classroom_id: string
  participant_id: string
  message_type: MapperInit['message_type']
  data: MapperInit['data']
}

interface Env {
  repository: ClassroomFedRepository
}

interface Response {
  classroom: Classroom
  occursIn: OccursIn
  message: Message
  messageOwnership: Ownership
  source: Source
}

export const appendMessageToClassroom = Service<Request, Env, Response>(
  ({ classroom_id, participant_id, message_type, data }) =>
    async ({ repository }) => {
      const [
        classroom,
        participant,
        {
          data: [participation],
        },
      ] = await Promise.all([
        repository.methods.get(classroom_id),
        repository.methods.get(participant_id),
        repository.methods.query(
          QueryBuilder<Participation>()
            .filterBy(
              Filter.and(
                Filter.where('source_id', '==', participant_id),
                Filter.where('target_id', '==', classroom_id),
              ),
            )
            .build(),
          'participation',
        ),
      ])

      if (!classroom || classroom._t !== 'classroom')
        return Left({ status: 'error', message: 'No founded classroom' })

      if (!participant || participant._t !== 'participant')
        return Left({ status: 'error', message: 'No founded participant' })

      if (!participation)
        return Left({
          status: 'error',
          message: `This classroom doesn't contains this participant: ${participant_id}`,
        })

      const [resolverResult, message] = await Promise.all([
        resourceResolver({
          message_type,
          data,
        })({ repository }),
        repository.methods.set(createMessage()),
      ])

      if (isLeft(resolverResult))
        return Left({
          status: 'error',
          message: 'Invalid received data type to append message',
        })

      const resource: Resource = resolverResult.value

      const [source, occursIn, messageOwnership] = await Promise.all([
        repository.methods.set(
          createSource({
            source_id: resource.meta.id,
            source_type: resource._t,
            target_id: message.meta.id,
          }),
        ),
        repository.methods.set(
          createOccursIn({
            source_id: message.meta.id,
            target_id: classroom.meta.id,
          }),
        ),
        repository.methods.set(
          createOwnership({
            source_id: participant.meta.id,
            target_id: message.meta.id,
            target_type: MessageURI,
          }),
        ),
      ])

      return Right({
        classroom,
        occursIn,
        message,
        messageOwnership,
        source,
      })
    },
)
