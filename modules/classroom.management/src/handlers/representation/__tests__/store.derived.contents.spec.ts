import {
  createAuthContext,
  createMeta,
  Left,
  Request,
  Right,
} from '@davna/core'

import { storeDerivedContentsHandler } from '../store.derived.contents.handler'

import {
  createParticipant,
  REPRESENTATION_KIND,
  REPRESENTATION_TYPE,
  TextURI,
  USAGE_STATUS,
} from '../../../entities'

import { ClassroomFedFake } from '../../../services/__fakes__/classroom.fed.fake'
import { getParticipantBySubjectId } from '../../../services'

jest.mock('../../../services')

describe('store derived contents handler', () => {
  let repository: any

  beforeEach(() => {
    repository = ClassroomFedFake()
    jest.clearAllMocks()
  })

  function entityMeta(id: string) {
    const now = new Date()
    return createMeta({
      id,
      created_at: now,
      updated_at: now,
      _idempotency_key: '',
    })
  }

  function authRequest(overrides?: Partial<any>) {
    return Request({
      metadata: {
        auth: createAuthContext(
          { id: 'account-1' },
          { type: 'agent', subject_id: 'agent-1' },
        ),
      },
      data: {
        contents: [],
      },
      ...overrides,
    })
  }

  it('should be able to return 401 when account participant is invalid', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock)
      .mockReturnValueOnce(() =>
        Promise.resolve(Left({ message: 'invalid account' })),
      )
      .mockReturnValueOnce(() =>
        Promise.resolve(
          Right(
            createParticipant(
              { subject_id: 'agent-1', type: 'agent' },
              entityMeta('participant-2'),
            ),
          ),
        ),
      )

    const result = await storeDerivedContentsHandler(authRequest())({
      repository,
    })

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({
      message: 'Invalid account id',
    })
  })

  it('should be able to return 401 when actor participant is invalid', async () => {
    ;(getParticipantBySubjectId as any as jest.Mock)
      .mockReturnValueOnce(() =>
        Promise.resolve(
          Right(
            createParticipant(
              { subject_id: 'account-1', type: 'costumer' },
              entityMeta('participant-1'),
            ),
          ),
        ),
      )
      .mockReturnValueOnce(() =>
        Promise.resolve(Left({ message: 'invalid actor' })),
      )

    const result = await storeDerivedContentsHandler(authRequest())({
      repository,
    })

    expect(result.metadata?.headers?.status).toBe(401)
    expect(result.data).toEqual({
      message: 'Invalid account id',
    })
  })

  it('should be able to store derived contents and return 203', async () => {
    const accountParticipant = createParticipant(
      { subject_id: 'account-1', type: 'costumer' },
      entityMeta('participant-account'),
    )

    const actorParticipant = createParticipant(
      { subject_id: 'agent-1', type: 'agent' },
      entityMeta('participant-actor'),
    )

    ;(getParticipantBySubjectId as any as jest.Mock)
      .mockReturnValueOnce(() => Promise.resolve(Right(accountParticipant)))
      .mockReturnValueOnce(() => Promise.resolve(Right(actorParticipant)))

    const setSpy = jest.spyOn(repository.methods, 'set')

    const result = await storeDerivedContentsHandler(
      authRequest({
        data: {
          contents: [
            {
              kind: REPRESENTATION_KIND.TRANSFORMATION,
              type: REPRESENTATION_TYPE.SUMMARY,
              target_type: 'audio',
              target_id: 'audio-1',
              content: 'derived text',
              metadata: { lang: 'en' },
              consumption: {
                unit: 'token',
                value: 10,
                raw_value: 12,
                normalization_factor: 1,
                precision: 0,
              },
            },
          ],
        },
      }),
    )({ repository })

    expect(result.metadata?.headers?.status).toBe(203)
    expect(result.data).toEqual({
      message: 'Accepted',
    })

    expect(setSpy).toHaveBeenCalledTimes(4)

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        _t: TextURI,
      }),
    )

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          source_id: actorParticipant.meta.id,
          target_type: TextURI,
        }),
      }),
    )

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          kind: REPRESENTATION_KIND.TRANSFORMATION,
          type: REPRESENTATION_TYPE.SUMMARY,
          target_id: 'audio-1',
          target_type: 'audio',
        }),
      }),
    )

    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          status: USAGE_STATUS.CONFIRMED,
          source_id: accountParticipant.meta.id,
          target_type: TextURI,
          metadata: expect.objectContaining({
            props: expect.objectContaining({
              text_owner_id: actorParticipant.meta.id,
            }),
          }),
        }),
      }),
    )
  })
})
