/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Handler,
  Response,
  SagaRepositoryProxy,
  UnitOfWorkSaga,
} from '@davna/core'

import { ClassroomFedRepository } from '../../repositories'
import {
  createOwnership,
  createRepresentation,
  createText,
  RepresentationBase,
  TextURI,
} from '../../entities'

import { Metadata } from '@davna/kernel'

interface Content extends RepresentationBase {
  target_id: string
  content: string
  metadata: Metadata
}

interface Data {
  participant_id: string
  contents: Content[]
}

interface Env {
  repository: ClassroomFedRepository
}

export const storeDerivedContentsHandler = Handler<Env, Data>(
  ({ data }) =>
    async env => {
      const { contents, participant_id } = data

      const uow = UnitOfWorkSaga()
      try {
        const repository = SagaRepositoryProxy(env.repository, uow)

        await Promise.all(
          contents.map(
            async ({
              kind,
              type,
              target_id,
              target_type,
              content,
              metadata,
            }) => {
              const text = await repository.methods.set(
                createText({ content, metadata }),
              )

              await Promise.all([
                repository.methods.set(
                  createOwnership({
                    source_id: participant_id,
                    target_id: text.meta.id,
                    target_type: TextURI,
                  }),
                ),
                repository.methods.set(
                  createRepresentation({
                    kind,
                    type,
                    target_type,
                    target_id,
                    source_id: text.meta.id,
                  }),
                ),
              ])
            },
          ),
        )

        return Response({
          metadata: { headers: { status: 203 } },
          data: { message: 'Accepted' },
        })
      } catch (e) {
        await uow.rollback()
        throw e
      }
    },
)
