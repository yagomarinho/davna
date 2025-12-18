/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValidObject } from '@davna/kernel'
import {
  ExtractValueByOperator,
  Where,
  WhereComposite,
  WhereLeaf,
  Operators,
} from '../models'
import { Entity } from '../../../../domain'
import { ExtractSearchablePropertiesFromEntity } from './query.builder'

/**
 * Creates a composite Where node.
 *
 * Combines two query conditions using a logical operator
 * ('and' or 'or'), enabling nested and complex filters.
 */

export function createWhereComposite<E extends Entity>(
  value: 'or' | 'and',
  left: Where<ExtractSearchablePropertiesFromEntity<E>>,
  right: Where<ExtractSearchablePropertiesFromEntity<E>>,
): WhereComposite<ExtractSearchablePropertiesFromEntity<E>> {
  return {
    value,
    left,
    right,
  }
}

/**
 * Creates a leaf Where node.
 *
 * Represents a single filtering condition applied
 * to a specific field using a given operator.
 */

export function createWhereLeaf<
  A extends ValidObject,
  O extends Operators = Operators,
  K extends keyof A = keyof A,
>(
  fieldname: K,
  operator: O,
  value: ExtractValueByOperator<A, O, K>,
): WhereLeaf<A> {
  return {
    value: {
      fieldname,
      operator,
      value,
    },
  }
}

/**
 * Creates a composite filter using a logical AND.
 *
 * Both left and right conditions must be satisfied.
 */

export function and<E extends Entity>(
  left: Where<ExtractSearchablePropertiesFromEntity<E>>,
  right: Where<ExtractSearchablePropertiesFromEntity<E>>,
): WhereComposite<ExtractSearchablePropertiesFromEntity<E>> {
  return createWhereComposite<E>('and', left, right)
}

/**
 * Creates a composite filter using a logical OR.
 *
 * Either left or right condition must be satisfied.
 */

export function or<E extends Entity>(
  left: Where<ExtractSearchablePropertiesFromEntity<E>>,
  right: Where<ExtractSearchablePropertiesFromEntity<E>>,
): WhereComposite<ExtractSearchablePropertiesFromEntity<E>> {
  return createWhereComposite('or', left, right)
}
