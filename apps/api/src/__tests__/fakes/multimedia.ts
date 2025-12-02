import { MultimediaProvider } from '@davna/classroom'

export function makeMultimedia(): MultimediaProvider {
  const convert: MultimediaProvider['convert'] = async ({
    buffer,
    mime,
    name,
  }) => ({
    buffer,
    codec: 'aac',
    duration: 12.154,
    format: 'mp4',
    mime,
    name,
  })

  const metadata: MultimediaProvider['metadata'] = async ({ mime, name }) => ({
    codec: 'aac',
    duration: 12.154,
    format: 'mp4',
    mime,
    name,
  })

  return {
    convert,
    metadata,
  }
}
