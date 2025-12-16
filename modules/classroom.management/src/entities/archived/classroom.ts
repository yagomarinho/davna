/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { applyTag, applyVersioning, Entity } from '@davna/core'

const URI = 'classroom'
type URI = typeof URI

export enum PARTICIPANT_ROLE {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

interface Participant {
  participant_id: string
  role: PARTICIPANT_ROLE
}

export interface ClassroomProps {
  owner_id: string
  participants: Participant[]
  history: string[]
}

export interface Classroom extends ClassroomProps, Entity<URI, 'v1'> {}

export interface CreateClassroom extends ClassroomProps, Partial<Entity> {}

export function Classroom(
  id: string,
  owner_id: string,
  participants: Participant[],
  history: string[],
  created_at: Date,
  updated_at: Date,
): Classroom {
  return applyVersioning('v1')(
    applyTag('classroom')({
      id,
      owner_id,
      participants,
      history,
      created_at,
      updated_at,
    }),
  )
}

Classroom.create = ({
  id = '',
  owner_id,
  participants,
  history,
  created_at,
  updated_at,
}: CreateClassroom) => {
  const now = new Date()
  return Classroom(
    id,
    owner_id,
    participants,
    history,
    created_at ?? now,
    updated_at ?? now,
  )
}
