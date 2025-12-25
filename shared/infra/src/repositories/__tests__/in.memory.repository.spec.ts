import {
  Batch,
  EntityContext,
  Filter,
  QueryBuilder,
  Repository,
} from '@davna/core'

import { InMemoryRepository } from '../in.memory.repository'
import { createEn, En, EnURI, setName } from './fakes/fake.entity'
import { fakeIdempotencyKey } from './fakes/fake.idempotency.key'
import { createEntityContext } from '../in.memory.repository/create.entity.context'

describe('InMemoryRepository', () => {
  let entityContext: EntityContext
  let repo: Repository<En>

  beforeEach(() => {
    entityContext = createEntityContext()
    repo = InMemoryRepository<En>({ entityContext, tag: EnURI })
  })

  it('should create a new entity without id and assign id/created_at/updated_at', async () => {
    entityContext.setIdempotency(fakeIdempotencyKey(1))

    const en = createEn({ name: 'John', value: 10, tags: [] })
    const saved = await repo.methods.set(en)

    expect(saved.meta.id).toBe('0')
    expect(saved.meta.created_at).toEqual(expect.any(Date))
    expect(saved.meta.updated_at).toEqual(expect.any(Date))
    expect(saved.meta._idempotency_key).toBe(fakeIdempotencyKey(1))

    const fetched = await repo.methods.get(saved.meta.id)
    expect(fetched).toEqual(saved)
  })

  it('should use a custom id provider when provided', async () => {
    let i = 100

    const customContext = {
      declareEntity: jest.fn().mockImplementation(entity =>
        entity._b(entity.props, {
          _r: 'entity',
          id: `u-${i++}`,
          created_at: new Date(),
          updated_at: new Date(),
          _idempotency_key: '',
        }),
      ),
    } as any as jest.Mocked<EntityContext>

    repo = InMemoryRepository<En>({ entityContext: customContext, tag: EnURI })

    const a = await repo.methods.set(
      createEn({ name: 'John', value: 10, tags: [] }),
    )

    const b = await repo.methods.set(
      createEn({ name: 'Mike', value: 11, tags: [] }),
    )

    expect(a.meta.id).toBe('u-100')
    expect(b.meta.id).toBe('u-101')
  })

  it('should update an existing entity (same id) and refresh updated_at without duplicating', async () => {
    const created = await repo.methods.set(
      createEn({ name: 'Ana Maria', value: 15, tags: [] }),
    )

    const updated = await repo.methods.set(setName('Ana', created))

    expect(updated.meta.id).toBe(created.meta.id)

    const { data: all } = await repo.methods.query()
    expect(all.length).toBe(1)
    expect(all[0].props.name).toBe('Ana')
  })

  it('should remove an entity by id', async () => {
    const john = await repo.methods.set(
      createEn({ name: 'John', value: 10, tags: [] }),
    )
    const mike = await repo.methods.set(
      createEn({ name: 'Mike', value: 11, tags: [] }),
    )

    await repo.methods.remove(john.meta.id)

    expect(repo.methods.get(john.meta.id)).toBeUndefined()
    expect(repo.methods.get(mike.meta.id)).toBeDefined()
  })

  it('should support limit and cursor for pagination', async () => {
    const upsert: Batch<En> = Array.from({ length: 7 }, (_, i) => ({
      type: 'upsert',
      data: createEn({
        name: `U${i}`,
        value: 20 + i,
        tags: [],
      }),
    }))

    await repo.methods.batch(upsert)

    const { data: page1, next_cursor: cursor1 } = await repo.methods.query(
      QueryBuilder<En>().limit(3).build(),
    )

    expect(cursor1).toBeTruthy()

    const { data: page2, next_cursor: cursor2 } = await repo.methods.query(
      QueryBuilder<En>().cursor(cursor1!).limit(3).build(),
    )

    expect(cursor2).toBeTruthy()

    const { data: page3 } = await repo.methods.query(
      QueryBuilder<En>().cursor(cursor2!).limit(3).build(),
    )

    expect(page1.map(u => u.props.name)).toEqual(['U0', 'U1', 'U2'])
    expect(page2.map(u => u.props.name)).toEqual(['U3', 'U4', 'U5'])
    expect(page3.map(u => u.props.name)).toEqual(['U6'])
  })

  it('should sort by single and multiple fields', async () => {
    const repo = InMemoryRepository<En>()

    await repo.methods.batch([
      { type: 'upsert', data: createEn({ name: 'C', value: 30, tags: [] }) },
      { type: 'upsert', data: createEn({ name: 'A', value: 20, tags: [] }) },
      { type: 'upsert', data: createEn({ name: 'B', value: 25, tags: [] }) },
    ])

    const { data: s1 } = await repo.methods.query(
      QueryBuilder<En>()
        .orderBy([{ property: 'name', direction: 'asc' }])
        .build(),
    )

    expect(s1.map(v => v.props.name)).toEqual(['A', 'B', 'C'])

    const { data: s2 } = await repo.methods.query(
      QueryBuilder<En>()
        .orderBy([{ property: 'value', direction: 'desc' }])
        .build(),
    )

    expect(s2.map(v => `${v.props.value}:${v.props.name}`)).toEqual([
      '30:C',
      '25:B',
      '20:A',
    ])
  })

  describe('where filters (leaf operators)', () => {
    let repo = InMemoryRepository<En>()

    beforeEach(() => {
      repo = InMemoryRepository<En>()

      repo.methods.batch([
        {
          type: 'upsert',
          data: createEn({ name: 'Ana', value: 28, tags: ['a', 'b'] }),
        },
        {
          type: 'upsert',
          data: createEn({ name: 'Bruno', value: 31, tags: ['b', 'c'] }),
        },
        {
          type: 'upsert',
          data: createEn({ name: 'Carla', value: 22, tags: ['d', 'y'] }),
        },
      ])
    })

    it('should filter with == and !=', async () => {
      const { data: eq } = await repo.methods.query(
        QueryBuilder<En>().filterBy('name', '==', 'Ana').build(),
      )
      const { data: ne } = await repo.methods.query(
        QueryBuilder<En>().filterBy('name', '!=', 'Ana').build(),
      )

      expect(eq.map(v => v.props.name)).toEqual(['Ana'])
      expect(ne.map(v => v.props.name).sort()).toEqual(['Bruno', 'Carla'])
    })

    it('should filter with >, >=, <, <=', async () => {
      const { data: gt } = await repo.methods.query(
        QueryBuilder<En>().filterBy('value', '>', 28).build(),
      )
      const { data: gte } = await repo.methods.query(
        QueryBuilder<En>().filterBy('value', '>=', 28).build(),
      )
      const { data: lt } = await repo.methods.query(
        QueryBuilder<En>().filterBy('value', '<', 28).build(),
      )
      const { data: lte } = await repo.methods.query(
        QueryBuilder<En>().filterBy('value', '<=', 28).build(),
      )

      expect(gt.map(v => v.props.name).sort()).toEqual(['Bruno'])
      expect(gte.map(v => v.props.name).sort()).toEqual(['Ana', 'Bruno'])
      expect(lt.map(v => v.props.name).sort()).toEqual(['Carla'])
      expect(lte.map(v => v.props.name).sort()).toEqual(['Ana', 'Carla'])
    })

    it('should filter with in and not-in', async () => {
      const { data: _in } = await repo.methods.query(
        QueryBuilder<En>().filterBy('name', 'in', ['Ana', 'X']).build(),
      )
      const { data: nin } = await repo.methods.query(
        QueryBuilder<En>().filterBy('name', 'not-in', ['Ana', 'X']).build(),
      )

      expect(_in.map(v => v.props.name).sort()).toEqual(['Ana'])
      expect(nin.map(v => v.props.name).sort()).toEqual(['Bruno', 'Carla'])
    })

    it('should filter with between', async () => {
      const { data: between } = await repo.methods.query(
        QueryBuilder<En>()
          .filterBy('value', 'between', { start: 25, end: 29 })
          .build(),
      )
      expect(between.map(v => v.props.name)).toEqual(['Ana'])
    })

    it('should filter with array-contains and array-contains-any', async () => {
      const { data: contains } = await repo.methods.query(
        QueryBuilder<En>().filterBy('tags', 'array-contains', 'a').build(),
      )
      const { data: any } = await repo.methods.query(
        QueryBuilder<En>()
          .filterBy('tags', 'array-contains-any', ['a', 'z'])
          .build(),
      )

      expect(contains.map(v => v.props.name)).toEqual(['Ana'])
      expect(any.map(v => v.props.name)).toEqual(['Ana'])
    })
  })

  describe('composite where (and/or)', () => {
    let repo = InMemoryRepository<En>()

    beforeEach(() => {
      repo = InMemoryRepository<En>()

      repo.methods.batch([
        {
          type: 'upsert',
          data: createEn({ name: 'Ana', value: 28, tags: ['a', 'b'] }),
        },
        {
          type: 'upsert',
          data: createEn({ name: 'Bruno', value: 31, tags: ['b', 'c'] }),
        },
        {
          type: 'upsert',
          data: createEn({ name: 'Carla', value: 22, tags: ['c'] }),
        },
      ])
    })

    it('should filter with AND composition', async () => {
      const where = Filter.and<En>(
        Filter.where('value', '<', 31),
        Filter.where('tags', 'array-contains', 'b'),
      )
      const { data: res } = await repo.methods.query(
        QueryBuilder<En>().filterBy(where).build(),
      )

      expect(res.map(v => v.props.name)).toEqual(['Ana'])
    })

    it('should filter with OR composition', async () => {
      const where = Filter.or<En>(
        Filter.where('value', '<', 23),
        Filter.where('name', '==', 'Bruno'),
      )
      const { data: res } = await repo.methods.query(
        QueryBuilder<En>().filterBy(where).build(),
      )
      expect(res.map(v => v.props.name).sort()).toEqual(['Bruno', 'Carla'])
    })
  })

  it('should keep created_at stable across updates when caller preserves it', async () => {
    const repo = InMemoryRepository<En>()

    const first = await repo.methods.set(
      createEn({
        name: 'Zoe',
        value: 18,
        tags: [],
      }),
    )

    const second = await repo.methods.set(setName('Zoe Lang', first))

    expect(second.meta.created_at).toEqual(first.meta.created_at)
  })

  it('should return empty array when no matches', async () => {
    const repo = InMemoryRepository<En>()

    repo.methods.set(
      createEn({
        name: 'Only',
        value: 1,
        tags: [],
      }),
    )

    const { data: res } = await repo.methods.query(
      QueryBuilder()
        .filterBy(Filter.where('name', '==', 'None'))
        .build(),
    )
    expect(res).toEqual([])
  })

  it('should upsert entities with batch operation', async () => {
    const repo = InMemoryRepository<En>()

    const result = await repo.methods.batch([
      {
        type: 'upsert',
        data: createEn({ name: 'Ana', value: 28, tags: [] }),
      },
      {
        type: 'upsert',
        data: createEn({ name: 'Miguel', value: 18, tags: [] }),
      },
      {
        type: 'upsert',
        data: createEn({ name: 'Pablo', value: 12, tags: [] }),
      },
    ])

    expect(result).toEqual(
      expect.objectContaining({
        status: 'successful',
        time: expect.any(Date),
      }),
    )

    const { data: fetched } = await repo.methods.query()
    expect(fetched.length).toBe(3)
  })

  it('should remove entities with batch operation', async () => {
    const repo = InMemoryRepository<En>()

    const user = await repo.methods.set(
      createEn({
        name: 'Ana',
        value: 28,
        tags: [],
      }),
    )

    const result = await repo.methods.batch([
      { type: 'remove', data: user.meta.id },
      {
        type: 'upsert',
        data: createEn({ name: 'Miguel', value: 18, tags: [] }),
      },
      {
        type: 'upsert',
        data: createEn({ name: 'Pablo', value: 12, tags: [] }),
      },
    ])

    expect(result).toEqual(
      expect.objectContaining({
        status: 'successful',
        time: expect.any(Date),
      }),
    )

    const { data: fetched } = await repo.methods.query()
    expect(fetched.length).toBe(2)
    expect(fetched.map(v => v.props.name).sort()).toEqual(['Miguel', 'Pablo'])
  })
})
