/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity } from '@davna/core'

export const ClassroomURI = 'classroom'
export type ClassroomURI = typeof ClassroomURI

export interface Classroom extends Entity<ClassroomURI> {
  name: string
}
