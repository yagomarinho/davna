/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Classroom, Ownership, Participation } from '../../entities'
import { EntityDTO } from './entity.dto'
import { MessageDTO } from './message.dto'
import { ParticipantDTO } from './participant.dto'

export interface ClassroomDTO extends EntityDTO {
  name: string
  owner_id: string
  participants: ParticipantDTO[]
  history: MessageDTO[]
}

interface From {
  classroom: Classroom
  classroomOwnership: Ownership
  participations: Participation[]
}

export function classroomDTOfromGraph({
  classroom,
  classroomOwnership,
  participations,
}: From): ClassroomDTO {
  const { name } = classroom.props
  const { id, created_at, updated_at } = classroom.meta

  const owner_id = classroomOwnership.props.source_id

  return {
    id,
    name,
    owner_id,
    history: [],
    participants: participations.map(participation => ({
      participant_id: participation.props.source_id,
      role: participation.props.participant_role,
    })),
    created_at,
    updated_at,
  }
}
