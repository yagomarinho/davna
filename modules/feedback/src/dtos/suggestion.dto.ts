import { Left, Request, Right } from '@davna/core'
import { object, string, ValidationError } from 'yup'

const dataSchema = object({
  suggestion: string().required(),
}).required()

export const suggestionValidate = async (request: Request) => {
  try {
    const validatedData = await dataSchema.validate(request.data)
    return Right(Request.data(validatedData, request))
  } catch (err: any) {
    if (err instanceof ValidationError)
      return Left({ errors: err.errors, message: err.message })

    throw err
  }
}
