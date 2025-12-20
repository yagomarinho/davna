/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, Repository } from '@davna/core'

/**
 * Repository pool.
 *
 * Represents a keyed collection of repositories
 * managing the same base entity type.
 *
 * Each entry in the pool is identified by a string key,
 * typically corresponding to a repository identifier,
 * data source name or resolution context.
 *
 * The pool allows repositories to be dynamically
 * selected, composed or federated at runtime
 * without coupling consumers to concrete implementations.
 */

export type RepositoryPool<E extends Entity> = Map<string, Repository<E>>
