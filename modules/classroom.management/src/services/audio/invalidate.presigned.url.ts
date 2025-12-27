/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Right, Service } from '@davna/core'
import { ClassroomFedRepository } from '../../repositories'
import { Audio, createAudio } from '../../entities'
import { concatenate } from '@davna/kernel'

interface Data {
  audio: Audio
}

interface Env {
  repository: ClassroomFedRepository
}

export const invalidatePresignedURL = Service<Data, Env, void>(
  ({ audio }) =>
    async ({ repository }) => {
      await repository.methods.set(
        createAudio(
          concatenate(audio.props, {
            storage: audio.props.storage.props,
            metadata: concatenate(audio.props.metadata.props, {
              presigned_url: undefined,
              expires_at: undefined,
            }),
          }),
          audio.meta,
        ),
      )

      return Right()
    },
)
