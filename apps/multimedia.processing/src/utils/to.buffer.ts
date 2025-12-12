import { AudioLike } from '../providers/audio.metadata.provider'

export function toBuffer(input: AudioLike): Buffer | null {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof ArrayBuffer) return Buffer.from(new Uint8Array(input))
  if (ArrayBuffer.isView(input)) return Buffer.from(input as Uint8Array)
  return null
}
