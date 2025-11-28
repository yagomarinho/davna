import { readFile } from 'node:fs/promises'
import { FakeAI } from '../fake.ai'

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}))

const readFileMock = readFile as unknown as jest.Mock

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

  it('should call readFile and return the file buffer on transcribe', async () => {
    const fakeBuffer = Buffer.from([1, 2, 3])
    readFileMock.mockResolvedValueOnce(fakeBuffer)

    const ai = FakeAI(config)

    const result = await ai.transcribe({ text: 'ignored' })

    expect(readFileMock).toHaveBeenCalledTimes(1)
    expect(readFileMock).toHaveBeenCalledWith('/tmp/audio.opus', { flag: 'r' })
    expect(result).toEqual(fakeBuffer)
  })

  it('should return transcribe on speechToText', async () => {
    const ai = FakeAI(config)

    const text = await ai.synthesize({ path: 'ignored' })

    expect(text).toEqual('transcribed text')
  })
})
