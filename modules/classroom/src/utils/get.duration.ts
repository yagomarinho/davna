import { parseBuffer } from 'music-metadata'

interface Options {
  buffer: Buffer
}

export async function getDuration({ buffer }: Options) {
  const metadata = await parseBuffer(buffer)
  return (metadata.format.duration || 0) * 1000
}
