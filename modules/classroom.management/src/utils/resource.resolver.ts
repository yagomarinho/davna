/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { OperationResult } from '@davna/core'
import { object, string } from 'yup'
import { ClassroomFedRepository } from '../repositories'
import { Audio, Text } from '../entities'

type AudioInit = {
  message_type: 'audio'
  data: {
    type: 'identifier'
    content: string
  }
}

type TextInit = {
  message_type: 'text'
  data: {
    type: 'content'
    content: string
  }
}

type MapperInit = AudioInit | TextInit

type ResourceMapResult =
  | {
      method: 'get'
      entity: 'audio'
      data: string
    }
  | {
      method: 'set'
      entity: 'text'
      data: string
    }

export interface ResourceMapper {
  (init: MapperInit): ResourceMapResult
}

export type Resource = Audio | Text

export interface Init {
  message_type: string
  data: unknown
}

export interface ResourceResolver {
  (
    init: Init,
  ): OperationResult<{ repository: ClassroomFedRepository }, Resource>
}

const audioSchema = object({
  type: string<'identifier'>().oneOf(['identifier']).required(),
  content: string().required(),
})

const textSchema = object({
  type: string<'content'>().oneOf(['content']).required(),
  content: string().required(),
})

const mapper: ResourceMapper = init => {
  switch (init.message_type) {
    case 'audio':
      audioSchema.validateSync(init.data)

      return {
        method: 'get',
        entity: 'audio',
        data: init.data.content,
      }

    case 'text':
      textSchema.validateSync(init.data)

      return {
        method: 'set',
        entity: 'text',
        data: init.data.content,
      }
  }
}

export const ResourceResolver: ResourceResolver = init => {
  // validar os dados
  // selecionar
}
