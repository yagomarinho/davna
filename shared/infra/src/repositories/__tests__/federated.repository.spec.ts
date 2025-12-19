import { QueryBuilder, Repository } from '@davna/core'
import { createID } from '@davna/kernel'

import { InMemoryRepository } from '../in.memory.repository'
import { FederatedRepository, IDContext } from '../federated.repository'

import { createUser, User, UserURI } from './fakes/fake.user'
import { createOrder, Order, OrderURI } from './fakes/fake.order'

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
    tag: 'federated',
    IDContext,
    repositories: [
      [
        UserURI,
        init => {
          userRepo = InMemoryRepository<User>({
            entityContext: init.entityContext,
            tag: UserURI,
          })

          return userRepo as any
        },
      ],
      [
        OrderURI,
        init => {
          orderRepo = InMemoryRepository<Order>({
            entityContext: init.entityContext,
            tag: OrderURI,
          })

          return orderRepo as any
        },
      ],
    ],
  })

  it('should route set() to the correct repository based on entity tag', async () => {
    IDContext.getIDEntity.mockResolvedValueOnce({
      props: { entity_tag: UserURI },
    } as any)

    const user: User = await repo.methods.set(
      createUser({ name: 'Ana' }) as any,
    )

    IDContext.getIDEntity.mockResolvedValueOnce({
      props: { entity_tag: OrderURI },
    } as any)

    const order: Order = await repo.methods.set(
      createOrder({ value: 100 }) as any,
    )

    expect(await repo.methods.get(user.meta.id)).toEqual(user)
    expect(await repo.methods.get(order.meta.id)).toEqual(order)
  })

  it('should resolve repository on get() using IDContext', async () => {
    const user: User = await repo.methods.set(
      createUser({ name: 'Ana' }) as any,
    )

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
    const user: User = await repo.methods.set(
      createUser({ name: 'Ana' }) as any,
    )

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
        },
      ),
    )

    const removeSpy = jest.spyOn(userRepo.methods, 'remove')

    await repo.methods.remove(user.meta.id)

    expect(removeSpy).toHaveBeenCalledWith(user.meta.id)
  })

  it('should aggregate query results from all repositories when no tag is provided', async () => {
    const user: User = await repo.methods.set(
      createUser({ name: 'Ana' }) as any,
    )
    const order: Order = await repo.methods.set(
      createOrder({ value: 100 }) as any,
    )

    const result: (User | Order)[] = await repo.methods.query()

    expect(result.map(e => e.meta.id).sort()).toEqual([
      user.meta.id,
      order.meta.id,
    ])
  })

  it('should query only the specified repository when tag is provided', async () => {
    const user = await userRepo.methods.set(createUser({ name: 'Ana' }))
    await orderRepo.methods.set(createOrder({ value: 100 }))

    const result = await repo.methods.query(
      QueryBuilder<never>().build(),
      UserURI as never,
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
      { type: 'upsert', data: createOrder({ value: 200 }) as any },
    ])

    expect(result).toEqual(
      expect.objectContaining({
        status: 'successful',
        time: expect.any(Date),
      }),
    )

    expect((await userRepo.methods.query()).length).toBe(0)
    expect((await orderRepo.methods.query()).length).toBe(2)
  })

  it('should return failed batch result when any repository batch fails', async () => {
    ;(orderRepo.methods as any).batch = jest.fn().mockResolvedValue({
      status: 'failed',
      time: new Date(),
    })

    const result = await repo.methods.batch([
      { type: 'upsert', data: createOrder({ value: 100 }) as any },
    ])

    expect(result).toEqual(
      expect.objectContaining({
        status: 'failed',
        failures: [OrderURI],
      }),
    )
  })

  it('should throw when setting an entity with an unregistered tag', async () => {
    const invalid = {
      _t: 'invalid',
      meta: {},
      props: {},
    }

    await expect(repo.methods.set(invalid as any)).rejects.toThrow(
      'No repository registered for tag "invalid"',
    )
  })
})
