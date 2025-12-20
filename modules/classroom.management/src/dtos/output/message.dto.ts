/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AudioDTO } from './audio.dto'
import { EntityDTO } from './entity.dto'
import { ParticipantDTO } from './participant.dto'

export interface MessageDTO extends EntityDTO {
  classroom_id: string
  participant: ParticipantDTO
  type: string
  data: AudioDTO
  transcription: string
  translation: string
}
