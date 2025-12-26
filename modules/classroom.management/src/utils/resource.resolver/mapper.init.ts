/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InferType, Lazy, lazy, mixed, object, string } from 'yup'

const audioInit = object({
  message_type: string<'audio'>().oneOf(['audio']).required(),
  data: object({
    type: string<'identifier'>().oneOf(['identifier']).required(),
    content: string().required(),
  }),
})

const textInit = object({
  message_type: string<'text'>().oneOf(['text']).required(),
  data: object({
    type: string<'content'>().oneOf(['content']).required(),
    content: string().required(),
  }),
})

type AudioInit = InferType<typeof audioInit>

type TextInit = InferType<typeof textInit>

export type MapperInit = AudioInit | TextInit

export const mapperInitSchema: Lazy<MapperInit> = lazy(value => {
  if (value && typeof value === 'object' && 'message_type' in value) {
    if (value.message_type === 'text') return textInit
    if (value.message_type === 'audio') return audioInit
  }

  return mixed<never>()
    .test({
      name: 'invalid schema',
      message: 'schema must correspond to AudioSchema or TextSchema',
      test: () => false,
    })
    .required()
})
