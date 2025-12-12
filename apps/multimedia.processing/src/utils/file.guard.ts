import { Left, Request, Right } from '@davna/core'
import { mixed, object, string, ValidationError } from 'yup'

export const fileGuard = async (request: Request) => {
  const metadataSchema = object({
    file: object({
      buffer: mixed<Buffer>()
        .test('is-buffer', 'Value must be a Buffer', value =>
          Buffer.isBuffer(value),
        ) // adicionar futuramente um validador de tamanho
        .required(),
      originalname: string().required(),
      mimetype: string().required(),
    }).required(),
  })

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
