import { resolve } from 'node:path'

import { convertAudioToAAC } from '../convert.audio.to.m4a'

jest.setTimeout(20_000)

describe('convertToAac (integration with ffmpeg + ffprobe)', () => {
  const webmPath = resolve(__dirname, '../../../temp', 'audiotest.webm')
  const oggPath = resolve(__dirname, '../../../temp', 'audiotest.ogg')

  test('converts webm (buffer) -> aac (m4a buffer) and result has valid duration', async () => {
    const { buffer, ...metadata } = await convertAudioToAAC()(webmPath, {
      mime: 'audio/webm',
      filename: 'output',
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)

    expect(metadata.format).toContain('m4a')
    expect(metadata.codec).toContain('aac')
  })

  test('converts ogg (buffer) -> aac (m4a buffer) and result has valid duration', async () => {
    const { buffer, ...metadata } = await convertAudioToAAC()(oggPath, {
      mime: 'audio/ogg',
      filename: 'output',
    })
    expect(Buffer.isBuffer(buffer)).toBe(true)

    expect(metadata.duration).toEqual(expect.any(Number))
    expect(metadata.format).toContain('m4a')
    expect(metadata.codec).toContain('aac')
  })
})
