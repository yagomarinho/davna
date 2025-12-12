import { Handler, Response } from '@davna/core'
import { healthCheck } from '../services'

export const healthCheckHandler = Handler(() => async () => {
  const result: any = healthCheck()({})

  return Response.data(result.value)
})
