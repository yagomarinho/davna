/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RawProps, Right, Service } from '@davna/core'
import { concatenate } from '@davna/kernel'

import { Audio, AudioProps, createAudio } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'

interface Request {
  audio: Audio
  props: Omit<RawProps<AudioProps>, 'status' | 'url'>
}
interface Env {
  repository: ClassroomFedRepository
}

export const persistAudio = Service<Request, Env, Audio>(
  ({ audio, props: { filename, mime_type, duration, metadata, storage } }) =>
    async ({ repository }) => {
      const persistedAudio = await repository.methods.set<Audio>(
        createAudio(
          {
            status: 'persistent',
            filename,
            mime_type,
            duration,
            url: `${process.env.API_BASE_URL}/audio/${audio.meta.id}`, // Tornar essa geração de nome externa
            metadata: concatenate(audio.props.metadata.props, metadata),
            storage,
          },
          audio.meta,
        ),
      )

      return Right(persistedAudio)
    },
)
