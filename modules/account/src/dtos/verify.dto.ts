import { Left, Request, Right } from '@davna/core'
import { object, string, ValidationError } from 'yup'
import { REFRESH_STRATEGY } from '../services/verify.session'

interface Options {
  tokenHeader: string
}

export const verifyValidation = ({ tokenHeader }: Options) => {
  const metadataSchema = object({
    query: object({
      refreshStrategy: string<REFRESH_STRATEGY>()
        .oneOf(Object.values(REFRESH_STRATEGY))
        .default(REFRESH_STRATEGY.LAX)
        .optional(),
    }).optional(),
    headers: object({
      'user-agent': string().default('anonymous').optional(),
      [tokenHeader]: string().default('').optional(),
    }),
  })

  return async (request: Request) => {
    try {
      const validatedMetadata = await metadataSchema.validate(
        request.metadata ?? {},
        { abortEarly: false },
      )
      return Right(Request.metadata(validatedMetadata, request))
    } catch (err: any) {
      if (err instanceof ValidationError)
        return Left({ errors: err.errors, message: err.message })

      throw err
    }
  }
}
