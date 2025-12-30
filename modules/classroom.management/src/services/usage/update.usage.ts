/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RawProps, Right, Service } from '@davna/core'
import { createUsage, Usage, UsageProps } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'
import { concatenate } from '@davna/kernel'

interface Data {
  usage: Usage
  props: Pick<RawProps<UsageProps>, 'status' | 'metadata' | 'consumption'>
}

interface Env {
  repository: ClassroomFedRepository
}

export const updateUsage = Service<Data, Env, Usage>(
  ({ usage, props: { status, metadata, consumption } }) =>
    async ({ repository }) => {
      const updatedUsage = await repository.methods.set<Usage>(
        createUsage(
          concatenate(usage.props, {
            status,
            consumption,
            metadata,
          }),
          usage.meta,
        ),
      )

      return Right(updatedUsage)
    },
)
