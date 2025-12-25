import { QueryBuilder, Repository } from '@davna/core'
import { createID } from '@davna/kernel'

import { InMemoryRepository } from '../in.memory.repository'
import { FederatedRepository, IDContext } from '../federated.repository'

import { createUser, User, UserURI } from './fakes/fake.user'
import { createOrder, Order, OrderURI } from './fakes/fake.order'
import { fakeIdempotencyKey } from './fakes/fake.idempotency.key'

describe('FederatedRepository', () => {
  let userRepo: Repository<User>
  let orderRepo: Repository<Order>
  let i = 100

  const IDContext = {
    declareEntity: jest.fn().mockImplementation(entity =>
      entity._b(entity.props, {
        _r: 'entity',
        id: `u-${i++}`,
        created_at: new Date(),
        updated_at: new Date(),
      }),
    ),
    getIDEntity: jest.fn(),
  } as any as jest.Mocked<IDContext>

  beforeEach(() => {
    i = 100

    IDContext.getIDEntity.mockReset()
    jest.clearAllMocks()
  })

  const repo = FederatedRepository({
    repositories: [
      init => {
        orderRepo = InMemoryRepository({
          entityContext: init.entityContext,
          tag: OrderURI,
        })

        return orderRepo
      },
      init => {
        userRepo = InMemoryRepository({
          entityContext: init.entityContext,
          tag: UserURI,
        })

        return userRepo
      },
    ],
    tag: 'test.federated',
    IDContext,
  })

  it('should route set() to the correct repository based on entity tag', async () => {
    IDContext.getIDEntity.mockResolvedValueOnce({
      props: { entity_tag: UserURI },
    } as any)

    const user = await repo.methods.set(createUser({ name: 'Ana' }))

    IDContext.getIDEntity.mockResolvedValueOnce({
      props: { entity_tag: OrderURI },
    } as any)

    const order = await repo.methods.set(createOrder({ value: 100 }))

    expect(await repo.methods.get(user.meta.id)).toEqual(user)
    expect(await repo.methods.get(order.meta.id)).toEqual(order)
  })

  it('should resolve repository on get() using IDContext', async () => {
    const user = await repo.methods.set(createUser({ name: 'Ana' }))

    IDContext.getIDEntity.mockResolvedValue(
      createID(
        {
          entity_tag: UserURI,
        },
        {
          id: user.meta.id,
          _r: 'entity',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: fakeIdempotencyKey(1),
        },
      ),
    )

    const fetched = await repo.methods.get(user.meta.id)

    expect(fetched).toEqual(user)
  })

  it('should return undefined on get() when IDContext cannot resolve id', async () => {
    IDContext.getIDEntity.mockResolvedValue(undefined)

    const fetched = await repo.methods.get('non-existent')

    expect(fetched).toBeUndefined()
  })

  it('should remove entity from the correct repository based on id', async () => {
    const user = await repo.methods.set(createUser({ name: 'Ana' }))

    IDContext.getIDEntity.mockResolvedValue(
      createID(
        {
          entity_tag: UserURI,
        },
        {
          id: user.meta.id,
          _r: 'entity',
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: fakeIdempotencyKey(1),
        },
      ),
    )

    const removeSpy = jest.spyOn(userRepo.methods, 'remove')

    await repo.methods.remove(user.meta.id)

    expect(removeSpy).toHaveBeenCalledWith(user.meta.id)
  })

  it('should aggregate query results from all repositories when no tag is provided', async () => {
    const user = await repo.methods.set(createUser({ name: 'Ana' }))
    const order = await repo.methods.set(createOrder({ value: 100 }))

    const { data: result } = await repo.methods.query()

    expect(result.map(e => e.meta.id).sort()).toEqual([
      user.meta.id,
      order.meta.id,
    ])
  })

  it('should query only the specified repository when tag is provided', async () => {
    const user = await userRepo.methods.set(createUser({ name: 'Ana' }))
    await orderRepo.methods.set(createOrder({ value: 100 }))

    const { data: result } = await repo.methods.query(
      QueryBuilder().build(),
      UserURI,
    )

    expect(result).toEqual([
      expect.objectContaining({
        meta: expect.objectContaining({ id: user.meta.id }),
      }),
    ])
  })

  it('should group batch operations by tag and execute them in the correct repositories', async () => {
    const user = await userRepo.methods.set(createUser({ name: 'Ana' }))
    await orderRepo.methods.set(createOrder({ value: 100 }))

    IDContext.getIDEntity.mockImplementation(async (id): Promise<any> => {
      if (id === user.meta.id) return { props: { entity_tag: UserURI } }
      return undefined
    })

    const result = await repo.methods.batch([
      { type: 'remove', data: user.meta.id },
      { type: 'upsert', data: createOrder({ value: 200 }) },
    ])

    expect(result).toEqual(
      expect.objectContaining({
        status: 'successful',
        time: expect.any(Date),
      }),
    )

    expect((await userRepo.methods.query()).data.length).toBe(0)
    expect((await orderRepo.methods.query()).data.length).toBe(2)
  })

  it('should return failed batch result when any repository batch fails', async () => {
    ;(orderRepo.methods as any).batch = jest.fn().mockResolvedValue({
      status: 'failed',
      time: new Date(),
    })

    const result = await repo.methods.batch([
      { type: 'upsert', data: createOrder({ value: 100 }) },
    ])

    expect(result).toEqual(
      expect.objectContaining({
        status: 'failed',
        failures: [OrderURI],
      }),
    )
  })

  it('should throw when setting an entity with an unregistered tag', async () => {
    const invalid: any = {
      _t: 'invalid',
      meta: {},
      props: {},
    }

    await expect(repo.methods.set(invalid)).rejects.toThrow(
      'No repository registered for tag "invalid"',
    )
  })
})
