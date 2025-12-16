/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Tagged } from '@davna/core'
import {
  AudioURI,
  ClassroomURI,
  MessageURI,
  ParticipantURI,
  TextURI,
} from '../vertices'

export const RepresentationURI = 'representation'
export type RepresentationURI = typeof RepresentationURI

export interface Representation extends Tagged<RepresentationURI> {
  text_id: string
  resource_id: string
  resource_type: ClassroomURI | MessageURI | AudioURI | TextURI | ParticipantURI
}
