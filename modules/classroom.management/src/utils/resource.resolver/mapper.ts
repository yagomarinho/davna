/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DraftEntity } from '@davna/core'
import { AudioURI, createText, Text, TextURI } from '../../entities'
import { MapperInit } from './mapper.init'

type ResourceMapResult =
  | {
      method: 'get'
      entity: 'audio'
      data: string
    }
  | {
      method: 'set'
      entity: 'text'
      data: DraftEntity<Text>
    }

export interface ResourceMapper {
  (init: MapperInit): ResourceMapResult
}

export const resourceMapper: ResourceMapper = init => {
  switch (init.message_type) {
    case 'audio':
      return {
        method: 'get',
        entity: AudioURI,
        data: init.data.content,
      }

    case 'text':
      return {
        method: 'set',
        entity: TextURI,
        data: createText({
          content: init.data.content,
          metadata: {},
        }),
      }
  }
}
