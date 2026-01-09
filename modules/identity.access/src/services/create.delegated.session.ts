/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Service } from '@davna/core'

interface Data {}

interface Env {}

interface Response {}

// Objetivo é construir uma sessão delegada
export const getSessionInfo = Service<Data, Env, Response>(
  data =>
    async ({}) => {},
)
