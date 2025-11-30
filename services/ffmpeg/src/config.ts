type API_KEY = {
  header: string
  key: string
}

export interface Config {
  baseUrl: string
  apiKey: API_KEY
}

export const DEFAULT_CONFIG: Config = {
  baseUrl: `${process.env.FFMPEG_SERVICE_BASE_URL}`,
  apiKey: {
    header: `${process.env.API_KEY_HEADER_NAME}`,
    key: `${process.env.API_ACCESS_TOKEN}`,
  },
}
