/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, Request, Right } from '@davna/core'
import { object, string, ValidationError } from 'yup'

const metadataSchema = object({
  headers: object({
    'user-agent': string().default('anonymous').optional(),
    'x-idempotency-key': string().required(),
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
