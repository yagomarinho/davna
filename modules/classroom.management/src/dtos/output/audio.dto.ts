/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EntityDTO } from './entity.dto'

export interface AudioDTO extends EntityDTO {
  owner_id: string
  name: string
  mime_type: string
  duration: number
  src: string
  internal_ref: {
    storage: string
    identifier: string
  }
}
