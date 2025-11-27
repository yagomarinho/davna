import OpenAI from 'openai'
import { createReadStream } from 'fs'
import { ChatGPT } from '../chatgpt'
import { GPTInput } from '../gpt.model'

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('fs', () => ({
  createReadStream: jest.fn(),
}))

const OpenAIMock = OpenAI as unknown as jest.Mock
const createReadStreamMock = createReadStream as unknown as jest.Mock

describe('ChatGPT module', () => {
  let responsesCreateMock: jest.Mock
  let audioSpeechCreateMock: jest.Mock
  let audioTranscriptionsCreateMock: jest.Mock

  beforeEach(() => {
    responsesCreateMock = jest.fn()
    audioSpeechCreateMock = jest.fn()
    audioTranscriptionsCreateMock = jest.fn()

    // Each call to new OpenAI() returns this shape
    OpenAIMock.mockImplementation(() => ({
      responses: {
        create: responsesCreateMock,
      },
      audio: {
        speech: {
          create: audioSpeechCreateMock,
        },
        transcriptions: {
          create: audioTranscriptionsCreateMock,
        },
      },
    }))

    // reset fs mock
    createReadStreamMock.mockReset()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call OpenAI.responses.create and return output_text for respond()', async () => {
    const fakeOutput = 'This is the GPT response'
    // make responses.create return an object with output_text
    responsesCreateMock.mockResolvedValueOnce({ output_text: fakeOutput })

    const client = ChatGPT({ apiKey: 'test-key' })

    const instruction = 'You are a helpful assistant'
    const input: GPTInput[] = [{ role: 'user', content: 'Hello' }]

    const result = await client.respond({ instruction, input })

    expect(responsesCreateMock).toHaveBeenCalledTimes(1)
    const callArg = responsesCreateMock.mock.calls[0][0]
    expect(callArg).toBeDefined()
    // check model and that instruction is included as system role
    expect(callArg.model).toEqual('o4-mini')
    expect(callArg.input).toEqual([
      { role: 'system', content: instruction },
      ...input,
    ])
    expect(result).toEqual(fakeOutput)
  })

  it('should call OpenAI.audio.speech.create and return Buffer for transcribe()', async () => {
    // mock a response whose arrayBuffer resolves to an ArrayBuffer
    const fakeArray = new Uint8Array([1, 2, 3]).buffer
    const fakeResponse = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(fakeArray),
    }
    audioSpeechCreateMock.mockResolvedValueOnce(fakeResponse)

    const client = ChatGPT({ apiKey: 'another-key' })

    const text = 'Hello text to speech'
    const buf = await client.transcribe({ text })

    expect(audioSpeechCreateMock).toHaveBeenCalledTimes(1)
    const callArg = audioSpeechCreateMock.mock.calls[0][0]
    expect(callArg).toBeDefined()
    expect(callArg.model).toEqual('gpt-4o-mini-tts')
    expect(callArg.response_format).toEqual('opus')
    expect(callArg.voice).toEqual('alloy')
    expect(callArg.input).toEqual(text)

    expect(Buffer.isBuffer(buf)).toBeTruthy()
    expect(buf).toEqual(Buffer.from(fakeArray))
  })

  it('should call OpenAI.audio.transcriptions.create and return text for speechToText()', async () => {
    // mock fs.createReadStream to return a dummy stream object
    const dummyStream = {} as any
    createReadStreamMock.mockReturnValueOnce(dummyStream)

    // mock transcriptions.create to return object with text property
    audioTranscriptionsCreateMock.mockResolvedValueOnce({
      text: 'transcribed text',
    })

    const client = ChatGPT({ apiKey: 'key-tts' })

    const result = await client.synthesize({ path: '/some/path/file.mp3' })

    expect(createReadStreamMock).toHaveBeenCalledTimes(1)
    expect(createReadStreamMock).toHaveBeenCalledWith('/some/path/file.mp3')

    expect(audioTranscriptionsCreateMock).toHaveBeenCalledTimes(1)
    const callArg = audioTranscriptionsCreateMock.mock.calls[0][0]
    expect(callArg).toBeDefined()
    // ensure file was forwarded (we don't inspect the exact stream object beyond that it was created)
    expect(callArg.file).toBe(dummyStream)
    expect(callArg.model).toEqual('gpt-4o-transcribe')

    expect(result).toEqual('transcribed text')
  })
})
