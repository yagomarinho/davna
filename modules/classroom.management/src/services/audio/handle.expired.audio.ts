/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Right, Service } from '@davna/core'
import { ClassroomFedRepository } from '../../repositories'

interface Data {}

interface Env {
  repository: ClassroomFedRepository
}

interface Response {}

export const handleExpiredAudio = Service<Data, Env, Response>(
  ({}) =>
    async ({ repository }) => {
      const {} = data

      return Right({
        ok: true,
      })
    },
)
