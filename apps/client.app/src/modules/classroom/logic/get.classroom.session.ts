/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export async function getClassroomSession(): Promise<string> {
  const response = await fetch('/api/classroom/session')

  if (!response.ok) throw new Error('Invalid Result')
  const { token } = await response.json()

  return token
}
