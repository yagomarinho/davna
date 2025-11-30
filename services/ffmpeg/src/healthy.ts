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
