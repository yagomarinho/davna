import { DEFAULT_CONFIG } from './config'
import { DurationRequest, getDuration } from './get.duration'
import { healthy } from './healthy'

export function ffmpeg({ config } = { config: DEFAULT_CONFIG }) {
  return {
    getDuration: (data: DurationRequest) => getDuration({ data, config }),
    healthy: () => healthy({ config }),
  }
}
