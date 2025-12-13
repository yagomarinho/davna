import { Entity } from '@davna/core'

export const ClassroomURI = 'classroom'
export type ClassroomURI = typeof ClassroomURI

export interface Classroom extends Entity<ClassroomURI> {
  name: string
}
