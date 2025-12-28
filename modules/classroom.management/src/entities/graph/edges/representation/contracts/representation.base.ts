/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AudioURI,
  ClassroomURI,
  MessageURI,
  ParticipantURI,
  TextURI,
} from '../../../vertices'
import { REPRESENTATION_KIND, REPRESENTATION_TYPE } from '../constants'

type TARGET_TYPE =
  | ClassroomURI
  | MessageURI
  | AudioURI
  | TextURI
  | ParticipantURI

export interface RepresentationBase {
  kind: REPRESENTATION_KIND
  type: REPRESENTATION_TYPE
  target_type: TARGET_TYPE
}
