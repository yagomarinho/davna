/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Tagged } from '@davna/core'

export const OcursInURI = 'occurs-in'
export type OcursInURI = typeof OcursInURI

export interface OccursIn extends Tagged<OcursInURI> {
  classroom_id: string
  message_id: string
}
