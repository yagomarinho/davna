/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a domain or application failure.
 *
 * Encapsulates a human-readable message and optional
 * contextual data related to the failure.
 *
 * Failures are intended to be explicit, serializable,
 * and safe to propagate across application boundaries.
 */

export interface Failure {
  message: string
  data?: any
}
