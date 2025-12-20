/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, Request, Right } from '@davna/core'
import { object, string, ValidationError } from 'yup'

interface Options {
  refreshTokenHeader: string
}

export const refreshValidation = ({ refreshTokenHeader }: Options) => {
  const metadataSchema = object({
    headers: object({
      'user-agent': string().default('anonymous').optional(),
      [refreshTokenHeader]: string().default('').optional(),
      'x-idempotency-key': string().required(),
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
