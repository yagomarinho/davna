import { Request } from '@davna/core'
import { storeDerivedContentsHandler } from '../store.derived.contents.handler'
import {
  AudioURI,
  REPRESENTATION_KIND,
  REPRESENTATION_TYPE,
  TextURI,
} from '../../../entities'

describe('store derived contents handler', () => {
  const repository = {
    methods: {
      set: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should store derived contents and return 203', async () => {
    const participant_id = 'participant-1'

    const contents = [
      {
        kind: REPRESENTATION_KIND.TRANSFORMATION,
        type: REPRESENTATION_TYPE.TRANSCRIPTION,
        target_type: AudioURI as AudioURI,
        target_id: 'audio-1',
        content: 'transcribed text',
        metadata: { language: 'en' },
      },
      {
        kind: REPRESENTATION_KIND.TRANSFORMATION,
        type: REPRESENTATION_TYPE.TRANSLATION,
        target_type: AudioURI as AudioURI,
        target_id: 'audio-2',
        content: 'translated text',
        metadata: { language: 'pt-BR' },
      },
    ]

    repository.methods.set.mockImplementation(async entity => ({
      ...entity,
      meta: {
        id: 'generated-id',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      },
    }))

    const result = await storeDerivedContentsHandler(
      Request.data({
        participant_id,
        contents,
      }),
    )({ repository } as any)

    expect(result.metadata?.headers?.status).toBe(203)
    expect(result.data).toEqual({ message: 'Accepted' })

    expect(repository.methods.set).toHaveBeenCalledTimes(contents.length * 3)

    expect(repository.methods.set).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          source_id: participant_id,
          target_type: TextURI,
        }),
      }),
    )

    expect(repository.methods.set).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          target_id: 'audio-1',
          type: REPRESENTATION_TYPE.TRANSCRIPTION,
        }),
      }),
    )
  })

  it('should rollback and throw if any persistence fails', async () => {
    const participant_id = 'participant-1'

    const contents = [
      {
        kind: REPRESENTATION_KIND.TRANSFORMATION,
        type: REPRESENTATION_TYPE.TRANSCRIPTION,
        target_type: AudioURI as AudioURI,
        target_id: 'audio-1',
        content: 'text',
        metadata: {},
      },
    ]

    repository.methods.set.mockRejectedValueOnce(new Error('database error'))

    await expect(
      storeDerivedContentsHandler(
        Request.data({
          participant_id,
          contents,
        }),
      )({ repository } as any),
    ).rejects.toThrow('database error')
  })
})
