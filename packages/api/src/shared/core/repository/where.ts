import { ValidObject } from '../../types'
import { Operators } from './operators'

export interface WhereLeaf<
  A extends ValidObject,
  O extends Operators = Operators,
  K extends keyof A = keyof A,
> {
  value: {
    fieldname: K
    operator: O
    value: A[K]
  }
}

export interface WhereComposite<A extends ValidObject> {
  value: 'or' | 'and'
  left: Where<A>
  right: Where<A>
}

export type Where<A extends ValidObject> =
  | WhereComposite<A>
  | WhereLeaf<A, Operators, keyof A>

// ----------
// Helpers
// ----------

function is(
  type: 'composite',
): (where: Where<any>) => where is WhereComposite<any>
function is(type: 'leaf'): (where: Where<any>) => where is WhereLeaf<any>
function is(type: string) {
  return (where: Where<any>): boolean =>
    typeof where.value === 'string' ? type === 'composite' : type === 'leaf'
}

export const isComposite = is('composite')
export const isLeaf = is('leaf')
