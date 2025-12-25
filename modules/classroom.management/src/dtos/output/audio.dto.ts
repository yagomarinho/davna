/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RawProps } from '@davna/core'
import { Audio, AudioProps, Ownership } from '../../entities'
import { EntityDTO } from './entity.dto'
import { Content } from './content'

export interface AudioDTO extends EntityDTO, RawProps<AudioProps> {
  owner_id: string
  contents: Content[]
}

export function audioDTOfromGraph({
  audio,
  ownership,
}: {
  audio: Audio
  ownership: Ownership
}): AudioDTO {
  const { status, filename, duration, mime_type, url, storage, metadata } =
    audio.props
  const { id, created_at, updated_at } = audio.meta

  return {
    id,
    owner_id: ownership.props.target_id,
    status,
    filename,
    duration,
    mime_type,
    url,
    storage: storage.props,
    metadata: metadata.props,
    created_at,
    updated_at,
    contents: [],
  }
}
