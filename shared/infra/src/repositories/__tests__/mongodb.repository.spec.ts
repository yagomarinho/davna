import { Filter, QueryBuilder } from '@davna/core'
import { MongoConverter, MongoRepository } from '../mongo.repository'
import { createEn, En, EnURI } from './fakes/fake.entity'
import { MongoWithURIConfig } from '../mongo.repository/mongo.client.config'
import { fakeIdempotencyKey } from './fakes/fake.idempotency.key'
import { mongoEntityContext } from '../mongo.repository/mongo.entity.context'

const converter: MongoConverter<En> = {
  to: ({
    props: { name, tags, value },
    meta: { id, created_at, updated_at, _idempotency_key },
  }) => ({
    id,
    data: { name, tags, value, created_at, updated_at, _idempotency_key },
  }),
  from: ({
    id,
    data: { name, tags, value, created_at, updated_at, _idempotency_key },
  }) =>
    createEn(
      { name, value, tags },
      {
        _r: 'entity',
        id,
        created_at,
        updated_at,
        _idempotency_key,
      },
    ),
}

const entityContext = mongoEntityContext()
const baseConfig: MongoWithURIConfig<En> = {
  uri: process.env.MONGODB_DEFAULT_CONNECT_URI || 'mongodb://localhost:27017',
  database: 'db',
  collection: 'en',
  converter,
  tag: EnURI,
  entityContext,
}

describe('mongo db repository', () => {
  const repo = MongoRepository<En>(baseConfig)
  let entity: En

  beforeAll(async () => {
    await repo.infra.connect()
    await repo.infra.clear()
  })

  it('get() busca por _id e aplica converter.from', async () => {
    entityContext.setIdempotency(fakeIdempotencyKey(1))

    entity = await repo.methods.set(
      createEn({
        name: 'Carlos',
        value: 35,
        tags: ['moda masculina', 'viagens internacionais'],
      }),
    )

    const en = await repo.methods.get(entity.meta.id)

    expect(en).toEqual(
      expect.objectContaining({
        _t: EnURI,
        meta: {
          id: expect.any(String),
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
          _r: 'entity',
          _idempotency_key: fakeIdempotencyKey(1),
        },
        props: {
          name: 'Carlos',
          value: 35,
          tags: ['moda masculina', 'viagens internacionais'],
        },
      }),
    )
  })

  it('get() retorna undefined quando não encontra', async () => {
    const en = await repo.methods.get('non-existant')
    expect(en).toBeUndefined()
  })

  it('set() faz upsert com $set', async () => {
    const data = {
      name: 'John',
      value: 22,
      tags: ['Videogame', 'Tech', 'generative AI'],
    }

    const created = await repo.methods.set(createEn(data))
    const received = await repo.methods.get(created.meta.id)

    expect(received).toEqual(
      expect.objectContaining({
        props: data,
        meta: expect.objectContaining({
          id: created.meta.id,
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
          _idempotency_key: fakeIdempotencyKey(1),
        }),
      }),
    )
  })

  it('remove() deleta pelo _id', async () => {
    await repo.methods.remove(entity.meta.id)

    const en = await repo.methods.get(entity.meta.id)
    expect(en).toBeUndefined()
  })

  it('query() sem where aplica filtro vazio', async () => {
    const { data: all } = await repo.methods.query()

    expect(all.length).toBe(1)
  })

  it('query() com paginação (limit + cursor)', async () => {
    await repo.infra.clear()
    await repo.methods.batch([
      {
        type: 'upsert',
        data: createEn({
          name: 'Carlos',
          value: 12,
          tags: ['videogame', 'tecnologia', 'inteligência artificial'],
        }),
      },
      {
        type: 'upsert',
        data: createEn({
          name: 'Miguel',
          value: 42,
          tags: ['tecnologia', 'trabalho remoto'],
        }),
      },
      {
        type: 'upsert',
        data: createEn({
          name: 'Antonio',
          value: 42,
          tags: ['tecnologia', 'trabalho remoto'],
        }),
      },
      {
        type: 'upsert',
        data: createEn({
          name: 'Michael',
          value: 42,
          tags: ['tecnologia', 'trabalho remoto'],
        }),
      },
      {
        type: 'upsert',
        data: createEn({
          name: 'Felipe',
          value: 42,
          tags: ['tecnologia', 'trabalho remoto'],
        }),
      },
    ])

    const { data: list } = await repo.methods.query(
      QueryBuilder()
        .filterBy('tags', 'array-contains', 'tecnologia')
        .cursor('1')
        .limit(2)
        .build(),
    )

    expect(list.length).toBe(2)
  })

  it('query() com sorts aplica .sort corretamente', async () => {
    const { data: all } = await repo.methods.query(
      QueryBuilder()
        .orderBy([{ property: 'name', direction: 'desc' }])
        .build(),
    )

    expect(all.map(e => e.props.name)).toEqual([
      'Miguel',
      'Michael',
      'Felipe',
      'Carlos',
      'Antonio',
    ])
  })

  it('query() com where leaf (>=) mapeia para $gte', async () => {
    await repo.infra.clear()
    await repo.methods.batch([
      {
        type: 'upsert',
        data: createEn({
          name: 'Carlos',
          value: 35,
          tags: ['tecnologia', 'trabalho remoto'],
        }),
      },
      {
        type: 'upsert',
        data: createEn({
          name: 'Miguel',
          value: 42,
          tags: ['tecnologia', 'ia generativa'],
        }),
      },
    ])
    const { data: list } = await repo.methods.query(
      QueryBuilder<En>()
        .orderBy([{ property: 'value', direction: 'desc' }])
        .filterBy('value', '>=', 18)
        .build(),
    )

    expect(list).toEqual([
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Miguel', value: 42 }),
      }),
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Carlos', value: 35 }),
      }),
    ])
  })

  it("query() com where 'array-contains' mapeia para { field: value }", async () => {
    const { data: list } = await repo.methods.query(
      QueryBuilder<En>()
        .filterBy('tags', 'array-contains', 'tecnologia')
        .orderBy([{ property: 'value', direction: 'asc' }])
        .build(),
    )

    expect(list).toEqual([
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Carlos', value: 35 }),
      }),
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Miguel', value: 42 }),
      }),
    ])
  })

  it("query() com where 'between' mapeia para $gte/$lte", async () => {
    const { data: list } = await repo.methods.query(
      QueryBuilder<En>()
        .filterBy('value', 'between', { start: 18, end: 45 })
        .orderBy([{ property: 'value', direction: 'asc' }])
        .build(),
    )

    expect(list).toEqual([
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Carlos', value: 35 }),
      }),
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Miguel', value: 42 }),
      }),
    ])
  })

  it("query() com where 'in' mapeia para $in", async () => {
    const { data: list } = await repo.methods.query(
      QueryBuilder<En>()
        .filterBy('name', 'in', ['Mônica', 'Marcos', 'Miguel'])
        .build(),
    )

    expect(list).toEqual([
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Miguel', value: 42 }),
      }),
    ])
  })

  it('query() com where composite AND/OR', async () => {
    await repo.methods.set(
      createEn({
        name: 'Antonio',
        value: 12,
        tags: ['tecnologia', 'videogame'],
      }),
    )

    const left = Filter.where('value', '<', 18)
    const right = Filter.where('tags', 'array-contains', 'tecnologia')
    const and = Filter.and(left, right)

    const { data: list } = await repo.methods.query(
      QueryBuilder().filterBy(and).build(),
    )

    expect(list).toEqual([
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Antonio', value: 12 }),
      }),
    ])

    const or = Filter.or(left, right)
    const { data: list2 } = await repo.methods.query(
      QueryBuilder().filterBy(or).build(),
    )

    expect(list2.length).toEqual(3)
  })

  it("query() com 'array-contains-any' vira $in", async () => {
    const { data: list } = await repo.methods.query(
      QueryBuilder<En>()
        .filterBy('tags', 'array-contains-any', [
          'viagens internacionais',
          'trabalho remoto',
        ])
        .build(),
    )

    expect(list).toEqual([
      expect.objectContaining({
        props: expect.objectContaining({ name: 'Carlos', value: 35 }),
      }),
    ])
  })

  afterAll(async () => {
    await repo.infra.clear()
    await repo.infra.disconnect()
  })
})
