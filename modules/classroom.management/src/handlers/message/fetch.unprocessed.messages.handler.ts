/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Handler, isLeft, Response } from '@davna/core'
import { ClassroomFedRepository } from '../repositories'
import { messageDTOFromGraph } from '../dtos'
import {
  fetchUnprocessedMessages,
  UnprocessedMessage,
} from '../services/message/fetch.unprocessed.messages'

interface Data {
  classroom_id: string
}

interface Metadata {}

interface Env {
  repository: ClassroomFedRepository
}

export const fetchUnprocessedMessagesHandler = Handler<Env, Data, Metadata>(
  request =>
    async ({ repository }) => {
      const { classroom_id } = request.data
      const batch_size = 5 // Isso deve ser
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
