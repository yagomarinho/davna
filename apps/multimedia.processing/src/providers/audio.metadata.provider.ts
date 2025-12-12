import { Readable } from 'node:stream'
import { AudioInfo } from '../services/get.audio.metadata'
import { Audio, ConvertToAccOptions } from '../services/convert.audio.to.aac'

export type AudioLike = Buffer | ArrayBuffer | Uint8Array | string | Readable

export interface AudioMetadataProvider {
  getMetadata: (input: AudioLike) => Promise<AudioInfo>
  convertAudioToAAC: (
    input: AudioLike,
    opts: ConvertToAccOptions,
  ) => Promise<Audio>
}
