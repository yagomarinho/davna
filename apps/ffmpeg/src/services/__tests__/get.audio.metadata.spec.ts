import { getAudioMetadata } from '../get.audio.metadata'
import { resolve } from 'node:path'
jest.setTimeout(10_000)

describe('getDuration (integration with ffprobe)', () => {
  const filePath = resolve(__dirname, '../../../temp/audiotest.m4a')

  test('should return correct metadata from audio', async () => {
    const metadata = await getAudioMetadata()(filePath)

    expect(metadata).toEqual(
      expect.objectContaining({
        duration: expect.any(Number),
        format: expect.any(String),
        codec: expect.any(String),
      }),
    )
  })
})
