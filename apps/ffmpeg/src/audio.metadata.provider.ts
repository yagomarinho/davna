export interface ResponseData {
  duration: number
}

export interface AudioMetadataProvider {
  getDuration: (buffer: Buffer<ArrayBufferLike>) => Promise<ResponseData>
}
