import { getResourceUsages } from '../get.resource.usages'
import { createUsage, USAGE_STATUS } from '../../../entities'
import { TIME_UNITS } from '@davna/kernel'
import { isLeft, isRight } from '@davna/core'

describe('get resource usage service', () => {
  const repository = {
    methods: {
      query: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return usage when it exists', async () => {
    const usage = createUsage({
      status: USAGE_STATUS.CONFIRMED,
      source_id: 'participant-1',
      target_id: 'resource-1',
      target_type: 'audio',
      metadata: {},
      consumption: {
        value: 10,
        raw_value: 10000,
        unit: TIME_UNITS.SEC,
        normalization_factor: 1000,
        precision: 0,
      },
    })

    repository.methods.query.mockResolvedValueOnce({
      data: [usage],
    })

    const result = await getResourceUsages({
      resource_id: 'resource-1',
    })({ repository } as any)

    expect(isRight(result)).toBeTruthy()

    expect(result.value).toEqual(expect.arrayContaining([usage]))

    expect(repository.methods.query).toHaveBeenCalledTimes(1)
  })

  it('should return Left when usage does not exist', async () => {
    repository.methods.query.mockResolvedValueOnce({
      data: [],
    })

    const result = await getResourceUsages({
      resource_id: 'resource-1',
    })({ repository } as any)

    expect(isLeft(result)).toBeTruthy()
    expect(result.value).toEqual(
      expect.objectContaining({
        status: 'error',
        message: 'Usage not founded',
      }),
    )

    expect(repository.methods.query).toHaveBeenCalledTimes(1)
  })
})
