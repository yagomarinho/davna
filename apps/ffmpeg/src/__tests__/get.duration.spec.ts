import { createReadStream } from 'node:fs'
import { getDuration } from '../get.duration'
import { resolve } from 'node:path'
jest.setTimeout(10_000)

function readFileAsBuffer(filePath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const stream = createReadStream(filePath)

    stream.on('data', (chunk: any) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

describe('getDuration (integration with ffprobe)', () => {
  const filePath = resolve(__dirname, '../../temp/audiotest.m4a')
  let audio: Buffer

  beforeAll(async () => {
    audio = await readFileAsBuffer(filePath)
  })

  test('should return correct duration from audio', async () => {
    const expectedSec = 1.5

    const { duration } = await getDuration()(audio)
    expect(Math.abs(duration - expectedSec)).toEqual(expect.any(Number))
  })
})
