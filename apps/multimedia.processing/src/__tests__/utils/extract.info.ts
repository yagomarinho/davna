/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function extractInfo(res) {
  const contentDisposition = res.headers['content-disposition'] ?? ''

  const filenameMatch = contentDisposition.match(
    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
  )

  return {
    name: filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : null,
    mime: res.headers['content-type'],
    codec: res.headers['x-file-codec'],
    duration: parseFloat(res.headers['x-file-duration'] ?? 0),
    format: res.headers['x-file-format'],
  }
}
