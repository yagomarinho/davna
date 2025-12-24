/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Handler, isLeft, Response } from '@davna/core'

import { downloadAudio } from '../services/download.audio'
import { StorageConstructor } from '../utils/storage'
import { ClassroomFedRepository } from '../repositories'
interface Env {
  repository: ClassroomFedRepository
  storage: StorageConstructor
}

export const downloadAudioHandler = Handler(request => async (env: Env) => {
  const { id: audio_id } = request.metadata.params

  const result = await downloadAudio({ audio_id })(env)

  if (isLeft(result))
    return Response({
      data: { message: result.value.message },
      metadata: {
        headers: {
          status: 404,
        },
      },
    })

  const { mime_type, buffer } = result.value

  const headers = {
    'Content-Type': mime_type,
    'Content-Length': buffer.length.toString(),
  }

  return Response({
    data: buffer,
    metadata: { headers },
  })
})
