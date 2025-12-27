/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Either, Failure, Left, OperationResult, Right } from '@davna/core'
import { Audio, AudioURI, Text, TextURI } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'
import { mapperInitSchema } from './mapper.init'
import { resourceMapper } from './mapper'

export type Resource = Audio | Text

export interface Init {
  message_type: string
  data: unknown
}

export interface ResourceResolver {
  (
    init: Init,
  ): OperationResult<
    { repository: ClassroomFedRepository },
    Either<Failure, Resource>
  >
}

export const resourceResolver: ResourceResolver =
  init =>
  async ({ repository }) => {
    try {
      const validatedInit = mapperInitSchema.validateSync(init)

      const entityMap = resourceMapper(validatedInit)

      const entity = await (entityMap.method == 'get'
        ? repository.methods.get(entityMap.data)
        : repository.methods.set(entityMap.data))

      if (!entity) throw new Error('No entity founded')
      if (entity._t !== AudioURI && entity._t !== TextURI)
        throw new Error('Invalid entity type')

      return Right(entity)
    } catch (e: any) {
      return Left({
        status: 'error',
        message: e.message,
        data: e,
      })
    }
  }
