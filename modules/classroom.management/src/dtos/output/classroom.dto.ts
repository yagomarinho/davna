/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EntityDTO } from './entity.dto'
import { MessageDTO } from './message.dto'
import { ParticipantDTO } from './participant.dto'

export interface ClassroomDTO extends EntityDTO {
  owner_id: string
  participants: ParticipantDTO[]
  history: MessageDTO[]
}
