import { Left, Request, Right } from '@davna/core'
import { object, string, ValidationError } from 'yup'

const metadataSchema = object({
  headers: object({
    'user-agent': string().default('anonymous').optional(),
  }),
})

const dataSchema = object({
  email: string().email().required(),
  password: string().required(),
}).required()

export const loginValidation = async (request: Request) => {
  try {
    const [validatedMetadata, validatedData] = await Promise.all([
      metadataSchema.validate(request.metadata ?? {}, { abortEarly: false }),
      dataSchema.validate(request.data, { abortEarly: false }),
    ])

    return Right(
      Request({
        data: validatedData,
        metadata: validatedMetadata,
      }),
    )
  } catch (err: any) {
    if (err instanceof ValidationError)
      return Left({ errors: err.errors, message: err.message })

    throw err
  }
}
