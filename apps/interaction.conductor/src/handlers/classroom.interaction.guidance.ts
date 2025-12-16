/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, Handler } from '@davna/core'

export const classroomInteractionGuidance = Handler(request => async env => {
  const { classroom_id } = request.metadata

  const classroom = await fetchUnprocessedMessages(classroom_id)

  const checkIdempotencies = await checkIdempotency()
})
