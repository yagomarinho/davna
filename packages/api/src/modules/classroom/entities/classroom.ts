import { Entity } from '../../../shared/core/entity'
import { applyTag } from '../../../shared/core/tagged'

export const URI = 'classroom'
export type URI = typeof URI

export enum PARTICIPANT_ROLE {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

interface Participant {
  participant_id: string
  role: PARTICIPANT_ROLE
}

export interface ClassroomProps {
  participants: Participant[]
  history: string[]
}

export interface Classroom extends ClassroomProps, Entity<URI> {}

export interface CreateClassroom extends ClassroomProps, Partial<Entity> {}

export function Classroom(
  id: string,
  participants: Participant[],
  history: string[],
  created_at: Date,
  updated_at: Date,
): Classroom {
  return applyTag('classroom')({
    id,
    participants,
    history,
    created_at,
    updated_at,
  })
}

Classroom.create = ({
  id = '',
  participants,
  history,
  created_at,
  updated_at,
}: CreateClassroom) => {
  const now = new Date()
  return Classroom(
    id,
    participants,
    history,
    created_at ?? now,
    updated_at ?? now,
  )
}
