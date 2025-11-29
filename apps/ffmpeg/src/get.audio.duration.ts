import { Handler, Response } from '@davna/core'
import { getDuration } from './get.duration'

export const getDurationHandler = Handler<{}>(request => async () => {
  const { file } = request.metadata

  try {
    const { duration } = await getDuration(file.buffer)

    return Response.data({
      name: file.originalname,
      mime: file.mimetype,
      duration,
    })
  } catch {
    return Response({
      data: { message: 'Invalid Audio File Type' },
      metadata: { headers: { status: 400 } },
    })
  }
})
