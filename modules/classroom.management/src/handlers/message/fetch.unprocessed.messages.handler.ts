/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AuthContext, Handler, isLeft, Response } from '@davna/core'

import { ClassroomFedRepository } from '../../repositories'
import {
  fetchUnprocessedMessages,
  UnprocessedMessage,
  ensureClassroomParticipation,
  getParticipantBySubjectId,
} from '../../services'
import { messageDTOFromGraph } from '../../dtos'

interface Metadata {
  auth: AuthContext
  params: {
    id: string
  }
  query?: {
    batch_size?: number
  }
}

interface Env {
  repository: ClassroomFedRepository
}

export const fetchUnprocessedMessagesHandler = Handler<Env, any, Metadata>(
  ({ metadata }) =>
    async ({ repository }) => {
      const {
        auth: {
          actor: { subject_id },
        },
        params: { id: classroom_id },
        query: { batch_size = 5 } = {},
      } = metadata

      const participantResult = await getParticipantBySubjectId({ subject_id })(
        { repository },
      )
      if (isLeft(participantResult))
        return Response({
          metadata: { headers: { status: 400 } },
          data: { message: participantResult.value.message },
        })

      const ensureParticipation = await ensureClassroomParticipation({
        classroom_id,
        participant_id: participantResult.value.meta.id,
      })({ repository })

      if (isLeft(ensureParticipation))
        return Response({
          metadata: { headers: { status: 401 } },
          data: { message: ensureParticipation.value.message },
        })

      let cursor_ref: string | undefined = undefined
      let done = false
      const unprocessed_messages: UnprocessedMessage[] = []

      while (!done) {
        const result = await fetchUnprocessedMessages({
          classroom_id,
          batch_size,
          cursor_ref,
        })({
          repository,
        })

        if (isLeft(result))
          return Response({
            metadata: { headers: { status: 400 } },
            data: { message: (result.value as any).message },
          })

        const page = result.value.unprocessed_messages

        cursor_ref = result.value.next_cursor
        unprocessed_messages.push(...page)

        if (page.length < batch_size || !cursor_ref) done = true
      }

      return Response.data({
        unprocessed_messages: unprocessed_messages.map(
          ({
            audio,
            audioOwnership,
            classroom_id,
            message,
            messageOwnership,
          }) =>
            messageDTOFromGraph({
              classroom_id,
              message,
              messageOwnership,
              audio,
              audioOwnership,
            }),
        ),
      })
    },
)
