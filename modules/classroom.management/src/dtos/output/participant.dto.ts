/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum PARTICIPANT_ROLE {
  COSTUMER = 'costumer',
  AGENT = 'agent',
}

export interface ParticipantDTO {
  participant_id: string
  role: PARTICIPANT_ROLE
}
