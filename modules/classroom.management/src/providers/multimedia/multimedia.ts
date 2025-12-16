/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Multimedia {
  buffer: Buffer
  name: string
  mime: string
}

export interface MediaInfo {
  name: string
  mime: string
  duration: number
  codec: string
  format: string
}

export interface Converted extends MediaInfo {
  buffer: Buffer
}

export interface MultimediaProvider {
  metadata: (media: Multimedia) => Promise<MediaInfo>
  convert: (media: Multimedia) => Promise<Converted>
}
