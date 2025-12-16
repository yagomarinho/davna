/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Server } from 'node:http'

export function connect({
  server,
  port,
}: {
  server: Server
  port: number
}): Promise<void> {
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      resolve()
    })

    server.on('error', err => reject(err))
  })
}
