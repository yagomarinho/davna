import { ValidObject } from '../../types'

export interface Sort<A extends ValidObject> {
  property: keyof A
  direction: 'asc' | 'desc'
}
