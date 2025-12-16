/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Reader, ReaderTask } from '@davna/types'

export type Result<E, A> = Reader<E, A> | ReaderTask<E, A>
