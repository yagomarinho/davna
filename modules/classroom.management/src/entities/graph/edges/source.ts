/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Tagged } from '@davna/core'
import { AudioURI } from '../vertices/audio'
import { TextURI } from '../vertices/text'

export const SourceURI = 'source'
export type SourceURI = typeof SourceURI

export interface Source extends Tagged<SourceURI> {
  message_id: string
  source_id: string
  source_type: AudioURI | TextURI
}
