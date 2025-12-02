import { MultimediaProvider } from '@davna/classroom'
import { ffmpeg } from '../../../services/ffmpeg'

export function Multimedia(): MultimediaProvider {
  const metadata: MultimediaProvider['metadata'] = async ({
    buffer,
    mime,
    name,
  }) => {
    const result = await ffmpeg().getMetadata({ audio: buffer, mime, name })
    if (!result) throw new Error('Invalid audio file to get metadata')
    return result
  }

  const convert: MultimediaProvider['convert'] = async ({
    buffer,
    mime,
    name,
  }) => {
    const result = await ffmpeg().convertAudioToAAC({
      audio: buffer,
      mime,
      name,
    })
    if (!result) throw new Error('Invalid audio file to get metadata')

    return result
  }

  return {
    metadata,
    convert,
  }
}
