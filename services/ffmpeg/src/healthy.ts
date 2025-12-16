/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Config } from './config'

interface Request {
  config: Config
}

interface HealthyResponse {
  healthy: boolean
}

export async function healthy({ config }: Request): Promise<HealthyResponse> {
  try {
    const response = await fetch(`${config.baseUrl}/health`)

    if (!response.ok) return { healthy: false }

    return response.json()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    return { healthy: false }
  }
}
