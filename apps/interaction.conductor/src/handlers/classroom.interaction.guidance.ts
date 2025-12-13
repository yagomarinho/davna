import { Entity, Handler } from '@davna/core'

export const classroomInteractionGuidance = Handler(request => async env => {
  const { classroom_id } = request.metadata

  const classroom = await fetchUnprocessedMessages(classroom_id)

  const checkIdempotencies = await checkIdempotency()
})
