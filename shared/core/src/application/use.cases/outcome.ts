/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Either } from '../../kernel'
import { OperationResult } from '../contracts'
import { Failure } from './failure'

/**
 * Represents the outcome of a service execution.
 *
 * Encapsulates:
 * - dependency on an environment (Reader or ReaderTask)
 * - a result that can succeed or fail (Either)
 *
 * The outcome explicitly models failure without throwing,
 * enabling predictable and composable error handling.
 */

export type ServiceOutcome<E, A> = OperationResult<E, Either<Failure, A>>
