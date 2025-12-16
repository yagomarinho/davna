/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, Metadata } from '@davna/core'

export const TextURI = 'text'
export type TextURI = typeof TextURI

export interface Text extends Entity<TextURI> {
  content: string
  metadata: Metadata
}
