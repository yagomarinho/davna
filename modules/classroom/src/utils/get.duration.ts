import { ffmpeg } from '@davna/ffmpeg.sdk'

interface Options {
  buffer: Buffer
  name: string
  mime: string
}

export async function getDuration({ buffer, name, mime }: Options) {
  const response = await ffmpeg().getDuration({ audio: buffer, name, mime })

  if (!response) return 0

  return (response.duration || 0) * 1000
}
