import { ValidObject } from '@davna/types'

export interface Sort<A extends ValidObject> {
  property: keyof A
  direction: 'asc' | 'desc'
}
