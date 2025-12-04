import { Left, Request, Right } from '@davna/core'
import { object, string, ValidationError } from 'yup'

const phoneRegExp = /^(?:\(\d{2,4}\)|\d{2,4})\s?\d{5}-?\d{4}$/

function normalizePhone(phone: string) {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

const dataSchema = object({
  lead: string()
    .matches(phoneRegExp, 'Phone number is not valid')
    .transform(normalizePhone)
    .required(),
}).required()

export const leadValidate = async (request: Request) => {
  try {
    const validatedData = await dataSchema.validate(request.data)
    return Right(Request.data(validatedData, request))
  } catch (err: any) {
    if (err instanceof ValidationError)
      return Left({ errors: err.errors, message: err.message })

    throw err
  }
}
