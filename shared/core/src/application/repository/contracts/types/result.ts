/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents the result of a repository operation.
 *
 * Allows repository implementations to be either
 * synchronous or asynchronous without changing
 * the consumer contract.
 */

export type RepositoryResult<E> = E | Promise<E>
