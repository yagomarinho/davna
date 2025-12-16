/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Readable } from 'node:stream'
import { string } from 'yup'
import { Left, Repository, Right, Service } from '@davna/core'

import { Audio, SUPORTED_MIME_TYPE } from '../entities/audio'
import { StorageConstructor } from '../utils/storage'
import { STORAGE_TYPE } from '@davna/providers'

interface Request {
  owner_id: string
  name: string
  mime: string
  duration: number
  buffer: Buffer
}

interface Env {
  storage: StorageConstructor
  audios: Repository<Audio>
  storage_driver: STORAGE_TYPE
}

export const uploadAudio = Service<Request, Env, Audio>(
  ({ owner_id, name, mime: MIME, duration, buffer }) =>
    async ({ storage, audios, storage_driver }) => {
      let mime: SUPORTED_MIME_TYPE

      try {
        mime = await string<SUPORTED_MIME_TYPE>()
          .oneOf(Object.values(SUPORTED_MIME_TYPE))
          .required()
          .validate(MIME)
      } catch {
        return Left({
          status: 'error',
          message: `Unsupported MimeType: ${MIME}`,
        })
      }

      const source = Readable.from(buffer)

      const { identifier, storage_type } = await storage({
        driver: storage_driver,
      }).upload({
        source,
        metadata: {
          mime,
          duration,
          name,
          owner_id,
        },
      })

      let audio = Audio.create({
        owner_id,
        name,
        mime,
        src: '',
        internal_ref: { storage: storage_type, identifier },
        duration,
      })

      audio = await audios.set(audio)

      audio = Audio.create({
        ...audio,
        // A construção do SRC pode vir a mudar no futuro, então
        // preciso deixar isso em aberto e colocar a solução externa
        // ou seja usar outro padrão
        src: `${process.env.API_BASE_URL}/audio/${audio.id}`,
      })

      audio = await audios.set(audio)

      return Right(audio)
    },
)
