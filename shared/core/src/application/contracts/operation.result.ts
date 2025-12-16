/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Reader, ReaderTask } from '../../kernel'

/**
 * Represents the result of an operation that depends on an environment.
 *
 * Allows operations to be expressed as either:
 * - a synchronous Reader
 * - an asynchronous ReaderTask
 *
 * This abstraction enables uniform composition of
 * context-aware computations regardless of execution model.
 */

export type OperationResult<E, A> = Reader<E, A> | ReaderTask<E, A>
