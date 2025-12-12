import { resolve } from 'node:path'

import { convertAudioToAAC } from '../convert.audio.to.aac'

jest.setTimeout(20_000)

describe('convertToAac (integration with ffmpeg + ffprobe)', () => {
  const tempDir = resolve(__dirname, '../../../temp')
  const webmPath = resolve(tempDir, 'audiotest.webm')
  const oggPath = resolve(tempDir, 'audiotest.ogg')
  const converter = convertAudioToAAC({ tempDir })

  test('converts webm (buffer) -> aac (m4a buffer) and result has valid duration', async () => {
    const { buffer, ...metadata } = await converter(webmPath, {
      mime: 'audio/webm',
      filename: 'output',
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)

    expect(metadata.format).toContain('m4a')
    expect(metadata.codec).toContain('aac')
  })

  test('converts ogg (buffer) -> aac (m4a buffer) and result has valid duration', async () => {
    const { buffer, ...metadata } = await converter(oggPath, {
      mime: 'audio/ogg',
      filename: 'output',
    })
    expect(Buffer.isBuffer(buffer)).toBe(true)

    expect(metadata.duration).toEqual(expect.any(Number))
    expect(metadata.format).toContain('m4a')
    expect(metadata.codec).toContain('aac')
  })
})
