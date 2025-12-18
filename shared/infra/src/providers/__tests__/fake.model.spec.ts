import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import { FakeAI } from '../gpt.model'

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}))

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}))

const readFileMock = readFile as unknown as jest.Mock
const existsSyncMock = existsSync as unknown as jest.Mock

describe('FakeAI', () => {
  const config = {
    textToRespond: 'hello world',
    pathToSpeech: '/tmp/audio.opus',
    textFromSpeech: 'transcribed text',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should respond with textToRespond', async () => {
    const ai = FakeAI(config)

    const result = await ai.respond({
      instruction: 'ignored',
      input: [],
    })

    expect(result).toEqual('hello world')
  })

  it('should call readFile and return the file buffer on synthesize', async () => {
    const fakeBuffer = Buffer.from([1, 2, 3])
    readFileMock.mockResolvedValueOnce(fakeBuffer)
    existsSyncMock.mockReturnValueOnce(true)

    const ai = FakeAI(config)

    const result = await ai.synthesize({ text: 'ignored' })

    expect(readFileMock).toHaveBeenCalledTimes(1)
    expect(readFileMock).toHaveBeenCalledWith('/tmp/audio.opus', { flag: 'r' })
    expect(result).toEqual(fakeBuffer)
  })

  it('should return transcribe on speechToText', async () => {
    const ai = FakeAI(config)

    const text = await ai.transcribe({ path: 'ignored' })

    expect(text).toEqual('transcribed text')
  })

  it('should return a valid WAV buffer when existSync returns false (fallback)', async () => {
    existsSyncMock.mockReturnValueOnce(false)
    const ai = FakeAI(config)

    const result = await ai.synthesize({ text: 'ignored' })

    const seconds = 2
    const sampleRate = 44100
    const channels = 1
    const bitDepth = 16
    const bytesPerSample = bitDepth / 8
    const totalSamples = Math.floor(seconds * sampleRate)
    const dataByteLength = totalSamples * channels * bytesPerSample
    const headerByteLength = 44
    const expectedTotalLength = headerByteLength + dataByteLength

    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toEqual(expectedTotalLength)

    expect(result.toString('ascii', 0, 4)).toEqual('RIFF')
    expect(result.toString('ascii', 8, 12)).toEqual('WAVE')

    expect(result.toString('ascii', 12, 16)).toEqual('fmt ')
    expect(result.readUInt32LE(16)).toEqual(16)
    expect(result.readUInt16LE(20)).toEqual(1)
    expect(result.readUInt16LE(22)).toEqual(channels)
    expect(result.readUInt32LE(24)).toEqual(sampleRate)

    const expectedByteRate = sampleRate * channels * bytesPerSample
    const expectedBlockAlign = channels * bytesPerSample
    expect(result.readUInt32LE(28)).toEqual(expectedByteRate)
    expect(result.readUInt16LE(32)).toEqual(expectedBlockAlign)
    expect(result.readUInt16LE(34)).toEqual(bitDepth)

    expect(result.toString('ascii', 36, 40)).toEqual('data')
    expect(result.readUInt32LE(40)).toEqual(dataByteLength)
  })
})
