/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { and, createWhereLeaf, or } from './where.builder'

/**
 * Filter utility namespace.
 *
 * Provides a composable and extensible set of helpers
 * for building query filter expressions.
 *
 * This object is intentionally open for extension and may
 * receive additional helpers over time.
 *
 * Current helpers:
 * - where: creates a leaf filter condition
 * - and: combines two filters where using logical AND
 * - or: combines two filters where using logical OR
 */

export const Filter = {
  where: createWhereLeaf,
  and,
  or,
}
