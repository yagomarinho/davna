/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Tagged } from '@davna/core'
import { AudioURI, ClassroomURI, MessageURI, TextURI } from '../vertices'

export const OwnershipURI = 'ownership'
export type OwnershipURI = typeof OwnershipURI

export interface Ownership extends Tagged<OwnershipURI> {
  participant_id: string
  resource_id: string
  resource_type: ClassroomURI | MessageURI | AudioURI | TextURI
}
