/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Right, Service } from '@davna/core'
import { DerivedContent } from '../../dtos'
import { ClassroomFedRepository } from '../../repositories'
import {
  createOwnership,
  createRepresentation,
  createText,
  createUsage,
  TextURI,
  USAGE_STATUS,
} from '../../entities'

interface Data {
  owner_id: string
  usage_participant_id: string
  contents: DerivedContent[]
}

interface Env {
  repository: ClassroomFedRepository
}

export const storeDerivedContents = Service<Data, Env, void>(
  ({ contents, owner_id, usage_participant_id }) =>
    async ({ repository }) => {
      await Promise.all(
        contents.map(
          async ({
            kind,
            type,
            target_id,
            target_type,
            content,
            metadata,
            consumption,
          }) => {
            const text = await repository.methods.set(
              createText({ content, metadata }),
            )

            await Promise.all([
              repository.methods.set(
                createOwnership({
                  source_id: owner_id,
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
              repository.methods.set(
                createUsage({
                  status: USAGE_STATUS.CONFIRMED,
                  target_type: TextURI,
                  target_id: text.meta.id,
                  source_id: usage_participant_id,
                  consumption: {
                    unit: consumption.unit,
                    value: consumption.value,
                    raw_value: consumption.raw_value,
                    normalization_factor: consumption.normalization_factor,
                    precision: consumption.precision,
                  },
                  metadata: {
                    text_owner_id: owner_id,
                  },
                }),
              ),
            ])
          },
        ),
      )

      return Right()
    },
)
