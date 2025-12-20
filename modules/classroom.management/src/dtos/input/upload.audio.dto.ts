/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Left, Request, Right } from '@davna/core'
import { mixed, object, string, ValidationError } from 'yup'
import { SUPORTED_MIME_TYPE } from '../entities'

const metadataSchema = object({
  file: object({
    buffer: mixed<Buffer>()
      .test('is-buffer', 'Value must be a Buffer', value =>
        Buffer.isBuffer(value),
      ) // adicionar futuramente um validador de tamanho
      .required(),
    originalname: string().required(),
    mimetype: string<SUPORTED_MIME_TYPE>()
      .oneOf(Object.values(SUPORTED_MIME_TYPE))
      .required(),
  }).required(),
})

export const uploadValidation = async (request: Request) => {
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
