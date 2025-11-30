import { Config, DEFAULT_CONFIG } from './config'
import { DurationRequest, getDuration } from './get.duration'
import { healthy } from './healthy'

interface Options {
  config?: Config
}

export function ffmpeg({ config }: Options = {}) {
  const c = config ?? DEFAULT_CONFIG()
  return {
    getDuration: (data: DurationRequest) => getDuration({ data, config: c }),
    healthy: () => healthy({ config: c }),
  }
}
