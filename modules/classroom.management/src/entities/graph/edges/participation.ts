/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Tagged } from '@davna/core'

export const ParticipationURI = 'participation'
export type ParticipationURI = typeof ParticipationURI

export enum PARTICIPANTION_ROLE {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export interface Participation extends Tagged<ParticipationURI> {
  classroom_id: string
  participant_id: string
  participation_role: PARTICIPANTION_ROLE
}
