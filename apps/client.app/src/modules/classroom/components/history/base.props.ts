/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'

export interface Participant {
  participant_id: string
  name: string
  role: AUDIO_MESSAGE_ROLE
}
export interface BaseProps {
  participant: Participant
}
