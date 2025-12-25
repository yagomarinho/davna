/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Filter, Left, QueryBuilder, Right, Service } from '@davna/core'

import { ResourceResolver } from '../utils'
import { ClassroomFedRepository } from '../repositories'

import {
  Classroom,
  createMessage,
  createOccursIn,
  createSource,
  Message,
  OccursIn,
  Participation,
  Source,
} from '../entities'

interface Request {
  classroom_id: string
  participant_id: string
  message_type: string
  data: unknown
}

interface Env {
  repository: ClassroomFedRepository
  resourceResolver: ResourceResolver
}

interface Response {
  classroom: Classroom
  message: Message
  source: Source
  occursIn: OccursIn
}

export const appendMessageToClassroom = Service<Request, Env, Response>(
  ({ classroom_id, participant_id, message_type, data }) =>
    async ({ repository, resourceResolver }) => {
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

      const [resource, message] = await Promise.all([
        resourceResolver({
          message_type,
          data,
        })({ repository }),
        repository.methods.set(createMessage()),
      ])

      const [source, occursIn] = await Promise.all([
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
      ])

      return Right({
        classroom,
        message,
        source,
        occursIn,
      })
    },
)
