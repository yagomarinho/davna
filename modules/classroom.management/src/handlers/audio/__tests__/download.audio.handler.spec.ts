import { Left, Request, Right } from '@davna/core'

import { downloadAudio as service } from '../../../services/audio/download.audio'
import { downloadAudioHandler } from '../download.audio.handler'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../../services/__fakes__/classroom.fed.fake'

jest.mock('../../../services/audio/download.audio', () => ({
  downloadAudio: jest.fn(),
}))

const downloadAudio = service as any as jest.Mock

describe('downloadAudioHandler', () => {
  const audio_id = 'audio-1'

  let repository: ClassroomFedRepository

  beforeEach(() => {
    repository = ClassroomFedFake()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 404 Response when downloadAudio service returns Left (error)', async () => {
    const req = Request.metadata({
      params: { id: audio_id },
    })

    const errorPayload = { message: 'audio not found' }
    downloadAudio.mockImplementationOnce(() => async () => Left(errorPayload))

    const result = await downloadAudioHandler(req)({
      repository,
      storage: (() => ({})) as any,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: errorPayload.message }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 404 }),
        }),
      }),
    )

    expect(downloadAudio).toHaveBeenCalledTimes(1)
    const calledWith = downloadAudio.mock.calls[0][0]
    expect(calledWith).toEqual(expect.objectContaining({ audio_id }))
  })

  it('should return buffer data and correct headers when downloadAudio service returns Right', async () => {
    const req = Request.metadata({
      params: { id: audio_id },
    })

    const buffer = Buffer.from('audio-binary-data')
    const mime_type = 'audio/mpeg'
    const servicePayload = { mime_type, buffer }

    downloadAudio.mockImplementationOnce(
      () => async () => Right(servicePayload),
    )

    const result = await downloadAudioHandler(req)({
      repository,
      storage: (() => ({})) as any,
    })

    expect(result).toBeDefined()

    expect(result.data).toEqual(buffer)

    expect(result.metadata).toBeDefined()
    expect(result.metadata).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': mime_type,
          'Content-Length': buffer.length.toString(),
        }),
      }),
    )

    expect(downloadAudio).toHaveBeenCalledTimes(1)
    const calledWith = downloadAudio.mock.calls[0][0]
    expect(calledWith).toEqual(expect.objectContaining({ audio_id }))
  })
})
