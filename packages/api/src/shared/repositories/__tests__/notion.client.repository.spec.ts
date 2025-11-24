import { Entity } from '../../core/entity'
import { extractPropertiesFromRecordMap } from '../../utils/extract.properties.from.record.map'
import { NotionClientRepository } from '../notion.client.repository'

type ExtendedRecordMap = Record<string, any>

jest.mock('notion-client', () => {
  const getPage = jest.fn()
  const MockNotionAPI = jest.fn().mockImplementation(() => ({
    getPage,
  }))

  ;(MockNotionAPI as any).__getPage = getPage
  return { NotionAPI: MockNotionAPI }
})

jest.mock('../../utils/extract.properties.from.record.map', () => ({
  extractPropertiesFromRecordMap: jest.fn(),
}))

const mockExtract = extractPropertiesFromRecordMap as jest.Mock

describe('NotionClientRepository', () => {
  const AUTH = 'secret_token_123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be able to initialize the Notion client with the correct auth token', async () => {
    const initializeMock = jest.fn()
    const getPageMock = jest.fn()

    const mockClient = (authToken: string): any => {
      initializeMock(authToken)
      return {
        getPage: getPageMock,
      }
    }

    const converter = {
      from: jest.fn((page: any) => ({ ...page, converted: true })),
    }

    NotionClientRepository<Entity>({
      auth_token: AUTH,
      converter,
      client: mockClient,
    })

    expect(initializeMock).toHaveBeenCalledWith(AUTH)
  })

  it('should be able to call getPage, extract properties and convert the result', async () => {
    const initializeMock = jest.fn()
    const getPageMock = jest.fn()

    const mockClient = (authToken: string): any => {
      initializeMock(authToken)
      return {
        getPage: getPageMock,
      }
    }

    const converter = {
      from: jest.fn((page: any) => ({ ...page, converted: true })),
    }

    const repo = NotionClientRepository<Entity>({
      auth_token: AUTH,
      converter,
      client: mockClient,
    })

    const id = 'abcd-1234'
    const recordMap: ExtendedRecordMap = { recordMap: { blocks: { [id]: {} } } }

    getPageMock.mockResolvedValueOnce(recordMap)
    mockExtract.mockReturnValueOnce({
      title: 'Hello',
      status: 'draft',
      customProp: 42,
    })

    const result = await repo.get(id)

    expect(getPageMock).toHaveBeenCalledTimes(1)
    expect(getPageMock).toHaveBeenCalledWith(id)
    expect(extractPropertiesFromRecordMap).toHaveBeenCalledWith(recordMap, id)
    expect(converter.from).toHaveBeenCalledWith({
      id,
      properties: {
        title: 'Hello',
        status: 'draft',
        customProp: 42,
      },
      recordMap,
    })
    expect(result).toEqual(
      expect.objectContaining({
        id,
        properties: {
          title: 'Hello',
          status: 'draft',
          customProp: 42,
        },
        converted: true,
        recordMap,
      }),
    )
  })
})
