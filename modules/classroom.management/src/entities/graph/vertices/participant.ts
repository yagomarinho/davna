/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '@davna/core'

export const ParticipantURI = 'participant'
export type ParticipantURI = typeof ParticipantURI

export interface Participant extends Entity<ParticipantURI> {
  type: 'costumer' | 'agent'
  subject_id: string
}
