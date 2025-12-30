import {
  Request,
  Left,
  Right,
  createMeta,
  createAuthContext,
} from '@davna/core'

import { appendMessageHandler } from '../append.message.handler'
import { ClassroomFedRepository } from '../../../repositories'
import { ClassroomFedFake } from '../../../services/__fakes__/classroom.fed.fake'

import {
  createParticipant,
  createAudio,
  createOwnership,
  createUsage,
  AUDIO_STATUS,
  USAGE_STATUS,
  createMessage,
} from '../../../entities'

import {
  getParticipantBySubjectId,
  ensureClassroomParticipation,
  getAudio,
  ensureOwnershipToTargetResource,
  getResourceUsages,
  invalidatePresignedURL,
  updateUsage,
  persistAudio,
  appendMessageToClassroom,
} from '../../../services'

import { STORAGE_TYPE } from '@davna/infra'
import { TIME_UNITS } from '@davna/kernel'

jest.mock('../../../services')

describe('append message handler', () => {
  let repository: ClassroomFedRepository

  const multimedia: any = {
    convert: jest.fn(),
  }

  const storageInstance = {
    download: jest.fn(),
    upload: jest.fn(),
    remove: jest.fn(),
  }

  const storage: any = jest.fn(() => storageInstance)

  beforeEach(() => {
    repository = ClassroomFedFake()
    jest.clearAllMocks()
  })

  function request(overrides?: Partial<any>) {
    return Request({
      metadata: {
        auth: createAuthContext(
          { id: 'account-1' },
          { type: 'agent', subject_id: 'agent-1' },
        ),
        params: { id: 'classroom-1' },
      },
      data: {
        resource: {
          id: 'audio-1',
          metadata: { presigned_url: 'signed-url' },
        },
      },
      ...overrides,
    })
  }

  function entityMeta(id: string) {
    const now = new Date()
    return createMeta({
      id,
      created_at: now,
      updated_at: now,
      _idempotency_key: '',
    })
  }

  it('should return 400 when participant is invalid', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Left({ message: 'invalid participant' })),
    )

    const result = await appendMessageHandler(request())({
      repository,
      multimedia,
      storage,
    })

    expect(result.metadata?.headers?.status).toBe(400)
    expect(result.data).toEqual({ message: 'invalid participant' })
  })

  it('should return 401 when participant is not part of classroom', async () => {
    const participant = createParticipant(
      { subject_id: 'agent-1', type: 'agent' },
      entityMeta('participant-1'),
    )

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Left({ message: 'not allowed' })),
    )

    const result = await appendMessageHandler(request())({
      repository,
      multimedia,
      storage,
    })

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({ message: 'not allowed' })
  })

  it('should append audio message successfully', async () => {
    const participant = createParticipant(
      { subject_id: 'agent-1', type: 'agent' },
      entityMeta('participant-1'),
    )

    const audio = createAudio(
      {
        filename: 'audio.mp3',
        mime_type: 'audio/mpeg',
        duration: 10,
        url: 'url',
        status: AUDIO_STATUS.PRESIGNED,
        metadata: {
          presigned_url: 'signed-url',
          expires_at: new Date(Date.now() + 10000),
        },
        storage: {
          bucket: 'bucket',
          internal_id: 'internal',
          type: STORAGE_TYPE.AWS_S3,
        },
      },
      entityMeta('audio-1'),
    )

    const ownership = createOwnership(
      {
        source_id: participant.meta.id,
        target_id: audio.meta.id,
        target_type: 'audio',
      },
      entityMeta('ownership-1'),
    )

    const usage = createUsage(
      {
        status: USAGE_STATUS.PENDING,
        source_id: participant.meta.id,
        target_id: audio.meta.id,
        target_type: 'audio',
        consumption: {
          value: 5,
          unit: TIME_UNITS.SEC,
          normalization_factor: 1000,
          raw_value: 5000,
          precision: 0,
        },
        metadata: {
          presigned_url: 'signed-url',
        },
      },
      entityMeta('usage-1'),
    )

    ;(getParticipantBySubjectId as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(participant)),
    )
    ;(ensureClassroomParticipation as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(true)),
    )
    ;(getAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(audio)),
    )
    ;(ensureOwnershipToTargetResource as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(ownership)),
    )
    ;(getResourceUsages as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right([usage])),
    )
    ;(invalidatePresignedURL as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(undefined),
    )

    multimedia.convert.mockResolvedValue({
      buffer: Buffer.from('audio'),
      duration: { value: 5, unit: 'seconds' },
      mime: 'audio/mpeg',
    })

    storageInstance.download.mockResolvedValue(Buffer.from('audio'))
    storageInstance.upload.mockResolvedValue({
      bucket: 'bucket',
      identifier: 'new-id',
      storage_type: STORAGE_TYPE.AWS_S3,
    })
    ;(updateUsage as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(undefined),
    )
    ;(persistAudio as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(Right(audio)),
    )
    ;(appendMessageToClassroom as any as jest.Mock).mockReturnValue(() =>
      Promise.resolve(
        Right({
          message: createMessage({}, entityMeta('message-1')),
          messageOwnership: createOwnership(
            {
              source_id: participant.meta.id,
              target_id: 'message-1',
              target_type: 'message',
            },
            entityMeta('ownership-2'),
          ),
        }),
      ),
    )

    const result = await appendMessageHandler(request())({
      repository,
      multimedia,
      storage,
    })

    expect(result.data).toEqual(
      expect.objectContaining({
        message: expect.objectContaining({
          id: 'message-1',
          source: expect.objectContaining({
            type: 'audio',
          }),
        }),
      }),
    )
  })
})
