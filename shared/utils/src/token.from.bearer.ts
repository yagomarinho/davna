/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function tokenFromBearer(bearer: string) {
  if (!(bearer.startsWith('Bearer ') || bearer.startsWith('bearer ')))
    throw new Error('Invalid Bearer token')

  const [, token] = bearer.split(' ')

  return token
}
