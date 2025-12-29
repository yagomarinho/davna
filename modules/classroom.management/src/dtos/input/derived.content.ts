/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Metadata } from '@davna/kernel'
import { Consumption, RepresentationBase } from '../../entities'

export interface DerivedContent extends RepresentationBase {
  target_id: string
  content: string
  metadata: Metadata
  consumption: Consumption
}
