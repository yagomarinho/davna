import { ObjectId } from 'mongodb'
import { MongoDBRepository } from '../mongodb.repository'
import { applyTag, Entity, Filter, Query } from '@davna/core'

const URI = 'user'
type URI = typeof URI
interface User extends Entity<URI> {
  name: string
  age: number
  interests: string[]
}

interface CreateUserData extends Partial<Entity> {
  name: string
  age: number
  interests?: string[]
}

function User(
  id: string,
  name: string,
  age: number,
  interests: string[],
  created_at: Date,
  updated_at: Date,
): User {
  return applyTag(URI)({
    id,
    name,
    age,
    interests,
    created_at,
    updated_at,
  })
}

User.create = ({
  id = '',
  name,
  age,
  interests = [],
  created_at = new Date(),
  updated_at = new Date(),
}: CreateUserData) => User(id, name, age, interests, created_at, updated_at)

const converter = {
  to: (e: any) => ({
    ...e,
    _id: e.id ? new ObjectId(e.id) : new ObjectId(),
  }),
  from: ({ _id, ...raw }: any) => ({ ...raw, id: _id?.toString() ?? '' }),
}

const baseConfig = {
  uri: process.env.MONGODB_DEFAULT_CONNECT_URI || 'mongodb://localhost:27017',
  database: 'db',
  collection: 'col',
  converter,
}

describe('mongo db repository', () => {
  const users = MongoDBRepository<User>(baseConfig)
  let entity: User

  beforeAll(async () => {
    await users.connect()
    await users.clear()
  })

  it('get() busca por _id e aplica converter.from', async () => {
    const saved = await users.set(
      User.create({
        name: 'Carlos',
        age: 35,
        interests: ['moda masculina', 'viagens internacionais'],
      }),
    )

    const user = await users.get(saved.id)

    expect(user).toEqual({
      __tag: 'user',
      id: expect.any(String),
      name: 'Carlos',
      age: 35,
      interests: expect.any(Array),
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    })
  })

  it('get() retorna undefined quando não encontra', async () => {
    const user = await users.get('617364616461637871717766')
    expect(user).toBeUndefined()
  })

  it('set() faz upsert com $set', async () => {
    const data = {
      name: 'João',
      age: 22,
      interests: ['videogame', 'tecnologia', 'inteligência artificial'],
    }

    entity = await users.set(User.create(data))

    const user = await users.get(entity.id)
    expect(user).toEqual(expect.objectContaining({ ...data, id: entity.id }))
  })

  it('remove() deleta pelo _id', async () => {
    await users.remove({ id: entity.id })

    const user = await users.get(entity.id)
    expect(user).toBeUndefined()
  })

  it('query() sem where aplica filtro vazio', async () => {
    const all = await users.query()

    expect(all.length).toBe(1)
  })

  it('query() com paginação (limit + cursor)', async () => {
    await users.set(
      User.create({
        name: 'Carlos',
        age: 12,
        interests: ['videogame', 'tecnologia', 'inteligência artificial'],
      }),
    )
    await users.set(
      User.create({
        name: 'Miguel',
        age: 42,
        interests: ['tecnologia', 'trabalho remoto'],
      }),
    )

    const list = await users.query(Query.where('name', '==', 'Carlos'))

    expect(list.length).toBe(2)
  })

  it('query() com sorts aplica .sort corretamente', async () => {
    const all = await users.query(
      Query.sorts([{ property: 'name', direction: 'desc' }]),
    )

    expect(all).toEqual([
      expect.objectContaining({ name: 'Miguel' }),
      expect.objectContaining({ name: 'Carlos' }),
      expect.objectContaining({ name: 'Carlos' }),
    ])
  })

  it('query() com where leaf (>=) mapeia para $gte', async () => {
    const list = await users.query(
      Query.sorts(
        [{ property: 'age', direction: 'desc' }],
        Query.where('age', '>=', 18),
      ),
    )

    expect(list).toEqual([
      expect.objectContaining({ name: 'Miguel', age: 42 }),
      expect.objectContaining({ name: 'Carlos', age: 35 }),
    ])
  })

  it("query() com where 'array-contains' mapeia para { field: value }", async () => {
    const list = await users.query(
      Query.sorts(
        [{ property: 'age', direction: 'asc' }],
        Query.where('interests', 'array-contains', 'tecnologia'),
      ),
    )

    expect(list).toEqual([
      expect.objectContaining({ name: 'Carlos', age: 12 }),
      expect.objectContaining({ name: 'Miguel', age: 42 }),
    ])
  })

  it("query() com where 'between' mapeia para $gte/$lte", async () => {
    const list = await users.query(
      Query.where('age', 'between', { start: 18, end: 45 }),
    )

    expect(list).toEqual([
      expect.objectContaining({ name: 'Carlos', age: 35 }),
      expect.objectContaining({ name: 'Miguel', age: 42 }),
    ])
  })

  it("query() com where 'in' mapeia para $in", async () => {
    const list = await users.query(
      Query.where('name', 'in', ['Mônica', 'Marcos', 'Miguel']),
    )

    expect(list).toEqual([expect.objectContaining({ name: 'Miguel', age: 42 })])
  })

  it('query() com where composite AND/OR', async () => {
    const left = Filter.where<User>('age', '<', 18)
    const right = Filter.where<User>(
      'interests',
      'array-contains',
      'tecnologia',
    )
    const and = Filter.and(left, right)
    const list = await users.query({ where: and })

    expect(list).toEqual([expect.objectContaining({ name: 'Carlos', age: 12 })])

    const or = Filter.or(left, right)
    const list2 = await users.query({ where: or })

    expect(list2).toEqual([
      expect.objectContaining({ name: 'Carlos', age: 12 }),
      expect.objectContaining({ name: 'Miguel', age: 42 }),
    ])
  })

  it("query() com 'array-contains-any' vira $in", async () => {
    const list = await users.query(
      Query.where('interests', 'array-contains-any', [
        'viagens internacionais',
        'trabalho remoto',
      ]),
    )

    expect(list).toEqual([
      expect.objectContaining({ name: 'Carlos', age: 35 }),
      expect.objectContaining({ name: 'Miguel', age: 42 }),
    ])
  })

  afterAll(async () => {
    await users.clear()
    await users.disconnect()
  })
})
