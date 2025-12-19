/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const ClassroomURI = 'classroom'
export type ClassroomURI = typeof ClassroomURI

export const ClassroomVersion = 'v1'
export type ClassroomVersion = typeof ClassroomVersion

export interface ClassroomProps {
  name: string
}

export interface Classroom extends Entity<
  ClassroomProps,
  ClassroomURI,
  ClassroomVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [ClassroomURI]: Classroom
  }
}

export function createClassroom(props: ClassroomProps): DraftEntity<Classroom>
export function createClassroom(
  props: ClassroomProps,
  meta: undefined,
  _version: ClassroomVersion,
): DraftEntity<Classroom>
export function createClassroom(
  props: ClassroomProps,
  meta: EntityMeta,
  _version?: ClassroomVersion,
): Classroom
export function createClassroom(
  { name }: ClassroomProps,
  meta?: EntityMeta,
  _version: ClassroomVersion = ClassroomVersion,
): DraftEntity<Classroom> | Classroom {
  return createEntity(
    ClassroomURI,
    _version,
    createClassroom,
    { name },
    meta as any,
  )
}
