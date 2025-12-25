/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Audio, Message, Ownership } from '../../entities'
import { AudioDTO, audioDTOfromGraph } from './audio.dto'
import { Content } from './content'
import { EntityDTO } from './entity.dto'

export interface MessageDTO extends EntityDTO {
  classroom_id: string
  owner_id: string
  source: {
    type: 'audio'
    data: AudioDTO
  }
  contents: Content[]
}

interface From {
  classroom_id: string
  message: Message
  messageOwnership: Ownership
  audio: Audio
  audioOwnership: Ownership
}

export function messageDTOFromGraph({
  classroom_id,
  message,
  messageOwnership,
  audio,
  audioOwnership,
}: From): MessageDTO {
  const { id, created_at, updated_at } = message.meta
  return {
    id,
    classroom_id,
    owner_id: messageOwnership.props.source_id,
    source: {
      type: 'audio',
      data: audioDTOfromGraph({ audio, ownership: audioOwnership }),
    },
    contents: [],
    created_at,
    updated_at,
  }
}
