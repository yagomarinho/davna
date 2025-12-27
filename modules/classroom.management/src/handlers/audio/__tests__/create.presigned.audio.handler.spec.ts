import { Left, Repository, Request, Right } from '@davna/core'

jest.mock('../../services/upload.audio', () => ({
  uploadAudio: jest.fn(),
}))

const uploadAudio = service as any as jest.Mock

describe('uploadAudioHandler', () => {
  const owner_id = 'owner-1'
  const filename = 'recording.mp3'
  const mime = 'audio/mpeg'

  let audios: Repository<Audio>
  let storage: jest.Mocked<StorageConstructor>
  let multimedia: jest.Mocked<MultimediaProvider>
  const storage_driver = STORAGE_TYPE.MONGO_GRIDFS

  beforeEach(() => {
    audios = InMemoryRepository<Audio>()
    storage = () => ({
      upload: jest.fn(),
      download: jest.fn(),
      check: jest.fn(),
    })
    multimedia = {
      metadata: jest.fn(),
      convert: jest.fn().mockImplementation(({ buffer, name, mime }) => ({
        buffer,
        name,
        mime,
        duration: 120,
      })),
    }
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 Invalid metadata when validation fails', async () => {
    // make name invalid (empty)
    const file = {
      originalname: '', // will fail string().required()
      mimetype: mime,
      buffer: Buffer.from('ok'),
    }

    const req = Request.metadata({
      file,
      account: { id: owner_id },
    })

    const result = await uploadAudioHandler(req)({
      audios,
      storage,
      multimedia,
      storage_driver,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Invalid metadata' }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 400 }),
        }),
      }),
    )

    expect(uploadAudio).not.toHaveBeenCalled()
  })

  it('should return 400 Invalid file shape when file.buffer is not a Buffer', async () => {
    const file = {
      originalname: filename,
      mimetype: mime,
      buffer: {} as any, // invalid shape
    }

    const req = Request.metadata({
      file,
      account: { id: owner_id },
    })

    const result = await uploadAudioHandler(req)({
      audios,
      storage,
      multimedia,
      storage_driver,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Invalid file shape' }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 400 }),
        }),
      }),
    )

    expect(uploadAudio).not.toHaveBeenCalled()
  })

  it('should return 400 when uploadAudio service returns Left (error)', async () => {
    const file = {
      originalname: filename,
      mimetype: mime,
      buffer: Buffer.from('audio-bytes'),
    }

    const req = Request.metadata({
      file,
      account: { id: owner_id },
    })

    const errorPayload = { message: 'storage failure' }
    uploadAudio.mockImplementationOnce(() => async () => Left(errorPayload))

    const result = await uploadAudioHandler(req)({
      audios,
      storage,
      multimedia,
      storage_driver,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ message: errorPayload.message }),
        metadata: expect.objectContaining({
          headers: expect.objectContaining({ status: 400 }),
        }),
      }),
    )

    expect(uploadAudio).toHaveBeenCalledTimes(1)
    const calledWith = uploadAudio.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({
        buffer: file.buffer,
        duration: expect.any(Number),
        mime,
        name: filename,
        owner_id,
      }),
    )
  })

  it('should return Response.data when uploadAudio service returns Right', async () => {
    const file = {
      originalname: filename,
      mimetype: mime,
      buffer: Buffer.from('audio-bytes'),
    }

    const req = Request.metadata({
      file,
      account: { id: owner_id },
    })

    const servicePayload = {
      id: 'audio-1',
      owner_id,
      name: filename,
      mime,
      duration: 120,
      url: 'https://cdn.example/audio-1.mp3',
    }

    uploadAudio.mockImplementationOnce(() => async () => Right(servicePayload))

    const result = await uploadAudioHandler(req)({
      audios,
      storage,
      multimedia,
      storage_driver,
    })

    expect(result).toBeDefined()
    expect(result).toEqual(expect.objectContaining({ data: servicePayload }))

    expect(uploadAudio).toHaveBeenCalledTimes(1)
    const calledWith = uploadAudio.mock.calls[0][0]
    expect(calledWith).toEqual(
      expect.objectContaining({
        buffer: file.buffer,
        duration: expect.any(Number),
        mime,
        name: filename,
        owner_id,
      }),
    )
  })
})
