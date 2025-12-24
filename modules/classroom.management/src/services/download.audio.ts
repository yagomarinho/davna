/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, Right, Service } from '@davna/core'

import { StorageConstructor } from '../utils/storage'
import { ClassroomFedRepository } from '../repositories'
import { AudioURI } from '../entities'

interface Request {
  audio_id: string
}

interface Response {
  mime_type: string
  buffer: Buffer
}

interface Env {
  repository: ClassroomFedRepository
  storage: StorageConstructor
}

export const downloadAudio = Service<Request, Env, Response>(
  ({ audio_id }) =>
    async ({ repository, storage }) => {
      const audio = await repository.methods.get(audio_id)

      if (!audio || audio._t !== AudioURI)
        return Left({ status: 'error', message: 'Audio not found' })

      const { type, internal_id } = audio.props.storage.props

      const buffer = await storage({
        driver: type,
      }).download({
        identifier: internal_id,
      })

      if (!buffer) return Left({ status: 'error', message: 'Audio not found' })

      return Right({
        mime_type: audio.props.mime_type,
        buffer,
      })
    },
)
