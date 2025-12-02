import { getDuration } from '../get.duration'
import { resolve } from 'node:path'
jest.setTimeout(10_000)

describe('getDuration (integration with ffprobe)', () => {
  const filePath = resolve(__dirname, '../../../temp/audiotest.m4a')

  test('should return correct duration from audio', async () => {
    const expectedSec = 1.5

    const { duration } = await getDuration()(filePath)
    expect(Math.abs(duration - expectedSec)).toEqual(expect.any(Number))
  })
})
