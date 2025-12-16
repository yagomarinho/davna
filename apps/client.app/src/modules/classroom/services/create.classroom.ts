/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'server-only'

import { apiKey, bearer } from '@/shared/utils'

interface Config {
  token: string
}

enum PARTICIPANT_ROLE {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

interface Participant {
  participant_id: string
  role: PARTICIPANT_ROLE
}

interface Classroom {
  id: string
  owner_id: string
  participants: Participant[]
  history: string[]
  created_at: string
  updated_at: string
}

export async function createClassroom({ token }: Config): Promise<Classroom> {
  const headers = new Headers()
  headers.set('X-Api-Key', apiKey(process.env.API_ACCESS_TOKEN!))
  headers.set('Authorization', bearer(token))

  const response = await fetch(`${process.env.API_BASE_URL}/classroom`, {
    method: 'post',
    headers,
  })

  if (!response.ok) throw new Error('Classroom not created')

  const { classroom } = await response.json()

  return classroom
}
