import { Filter } from '../../core/repository'
import { NotionRepository } from '../notion.repository'

const queryMock = jest.fn()

// cliente fake para injeção
const mockClient = () =>
  ({
    dataSources: {
      query: queryMock,
    },
  }) as any

const collection_id = 'ds_123'
const auth_token = 'secret'

const propertyMapper: any = {
  id: {
    property: 'ID',
    type: 'rich_text',
    operators: {
      '==': 'equals',
      '!=': 'does_not_equal',
      in: 'equals',
      'not-in': 'does_not_equal',
    },
    converter: { to: (v: unknown) => v },
  },
  name: {
    property: 'Name',
    type: 'title',
    operators: {
      '==': 'equals',
      '!=': 'does_not_equals',
      in: 'equals',
      'not-in': 'does_not_equals',
      'array-contains-any': 'contains',
    },
    converter: { to: (v: unknown) => v },
  },
  age: {
    property: 'Age',
    type: 'number',
    operators: {
      '==': 'equals',
      '!=': 'does_not_equals',
      '>': 'greater_than',
      '>=': 'greater_than_or_equal_to',
      '<': 'less_than',
      '<=': 'less_than_or_equal_to',
      between: ['greater_than_or_equal_to', 'less_than_or_equal_to'],
    },
    converter: { to: (v: unknown) => v },
  },
}

const fromConverter = (page: any): any => ({
  id: page.id,
  name: (page as any).properties?.Name ?? 'unknown',
  age: (page as any).properties?.Age ?? 0,
})

const repo = NotionRepository<any>({
  auth_token,
  collection_id,
  converter: { from: fromConverter },
  propertyMapper,
  client: mockClient,
})

describe('notion repository test', () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it('should map a simple equality (==) filter correctly', async () => {
    const where = Filter.where('name', '==', 'Alice')

    queryMock.mockResolvedValueOnce({
      results: [
        {
          object: 'page',
          id: 'p1',
          in_trash: false,
          properties: { Name: 'Alice', Age: 30 },
        },
      ],
    })

    const sorts = [{ property: 'age', direction: 'asc' }]
    const limit = 5

    const rows = await repo.query({ where: where as any, limit, sorts } as any)

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data_source_id: collection_id,
        page_size: limit,
        sorts: [{ property: 'Age', direction: 'ascending' }],
        filter: {
          property: 'Name',
          title: { equals: 'Alice' },
        },
      }),
    )

    expect(rows).toEqual([{ id: 'p1', name: 'Alice', age: 30 }])
  })

  it('should map composite "in" as an OR of equals', async () => {
    const where = Filter.where('name', 'in', ['Alice', 'Bob'])

    queryMock.mockResolvedValueOnce({
      results: [
        {
          object: 'page',
          id: 'p1',
          in_trash: false,
          properties: { Name: 'Alice' },
        },
        {
          object: 'page',
          id: 'p2',
          in_trash: false,
          properties: { Name: 'Bob' },
        },
      ],
    })

    const rows = await repo.query({
      where: where as any,
      limit: 10,
      sorts: [],
    } as any)

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          property: 'Name',
          or: [{ title: { equals: 'Alice' } }, { title: { equals: 'Bob' } }],
        },
      }),
    )

    expect(rows.map(r => r.id)).toEqual(['p1', 'p2'])
  })

  it('should map "array-contains-any" as an OR of contains', async () => {
    const where = Filter.where('name', 'array-contains-any', ['A', 'B'])

    queryMock.mockResolvedValueOnce({ results: [] })

    await repo.query({ where: where as any, limit: 10, sorts: [] } as any)

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          property: 'Name',
          or: [{ title: { contains: 'A' } }, { title: { contains: 'B' } }],
        },
      }),
    )
  })

  it('should ignore non-page objects and trashed pages', async () => {
    const where = Filter.where('id', '==', 'p1')

    queryMock.mockResolvedValueOnce({
      results: [
        { object: 'database', id: 'db1' },
        { object: 'page', id: 'p1', in_trash: false, properties: {} },
        { object: 'page', id: 'p2', in_trash: true, properties: {} },
      ],
    })

    const rows = await repo.query({
      where: where as any,
      limit: 10,
      sorts: [],
    } as any)
    expect(rows.map(r => r.id)).toEqual(['p1'])
  })

  it('should throw when the field name is invalid', async () => {
    const where = Filter.where('unknown_field', '==', 'X')

    queryMock.mockResolvedValueOnce({ results: [] })

    await expect(
      repo.query({ where: where as any, limit: 10, sorts: [] } as any),
    ).rejects.toThrow('invalid fieldname')
  })

  it('should throw when the operator has no mapping', async () => {
    const where = Filter.where('age', 'in', [18, 30])

    queryMock.mockResolvedValueOnce({ results: [] })

    await expect(
      repo.query({ where: where as any, limit: 10, sorts: [] } as any),
    ).rejects.toThrow('Invalid where operator')
  })

  it('should map multiple sorts (asc/desc) correctly', async () => {
    const where = Filter.where('id', '==', 'p1')

    queryMock.mockResolvedValueOnce({ results: [] })

    await repo.query({
      where: where as any,
      limit: 10,
      sorts: [
        { property: 'name', direction: 'asc' },
        { property: 'age', direction: 'desc' },
      ] as any,
    } as any)

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sorts: [
          { property: 'Name', direction: 'ascending' },
          { property: 'Age', direction: 'descending' },
        ],
      }),
    )
  })

  it('should map "not-in" as an AND of does_not_equal', async () => {
    const where = Filter.where('name', 'not-in', ['Foo', 'Bar'])
    queryMock.mockResolvedValueOnce({ results: [] })

    await repo.query({ where: where as any, limit: 10, sorts: [] } as any)

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          property: 'Name',
          and: [
            { title: { does_not_equals: 'Foo' } },
            { title: { does_not_equals: 'Bar' } },
          ],
        },
      }),
    )
  })

  it('should map "between" as an AND of >= and <=', async () => {
    const where = Filter.where('age', 'between', { start: 18, end: 30 })
    queryMock.mockResolvedValueOnce({ results: [] })

    await repo.query({ where: where as any, limit: 10, sorts: [] } as any)

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          property: 'Age',
          and: [
            { number: { greater_than_or_equal_to: 18 } },
            { number: { less_than_or_equal_to: 30 } },
          ],
        },
      }),
    )
  })
})
