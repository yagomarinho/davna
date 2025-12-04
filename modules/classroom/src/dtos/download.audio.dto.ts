import { Left, Request, Right } from '@davna/core'
import { object, string, ValidationError } from 'yup'

const metadataSchema = object({
  params: object({
    id: string().required(),
  }).required(),
})

export const downloadValidation = async (request: Request) => {
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
