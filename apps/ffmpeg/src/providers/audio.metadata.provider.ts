import { Readable } from 'node:stream'

export interface ResponseData {
  duration: number
}

export type AudioLike = Buffer | ArrayBuffer | Uint8Array | string | Readable

export interface AudioMetadataProvider {
  getDuration: (buffer: AudioLike) => Promise<ResponseData>
}
