import { google } from 'googleapis'

import { EntityContext, EntityMeta } from '@davna/core'

import {
  GoogleSheetsRepository,
  GCPCredentials,
} from '../google.sheets.repository'
import { createEn, En, EnURI } from './fakes/fake.entity'

jest.setTimeout(20_000)

async function getLastValue(
  auth: Awaited<ReturnType<typeof getAuth>>,
  spreadsheetId: string,
  range: string,
) {
  const sheets = google.sheets({ version: 'v4', auth })

  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return result.data.values
    ? result.data.values.length
      ? result.data.values.slice(-1)[0]
      : undefined
    : undefined
}

function makeCred(): GCPCredentials {
  return {
    type: process.env.GCP_TYPE ?? '',
    project_id: process.env.GCP_PROJECT_ID ?? '',
    private_key_id: process.env.GCP_PRIVATE_KEY_ID ?? '',
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
    client_email: process.env.GCP_CLIENT_EMAIL ?? '',
    client_id: process.env.GCP_CLIENT_ID ?? '',
    auth_uri: process.env.GCP_AUTH_URI ?? '',
    token_uri: process.env.GCP_TOKEN_URI ?? '',
    auth_provider_x509_cert_url:
      process.env.GCP_AUTH_PROVIDER_X509_CERT_URL ?? '',
    client_x509_cert_url: process.env.GCP_CLIENT_X509_CERT_URL ?? '',
    universe_domain: process.env.GCP_UNIVERSE_DOMAIN ?? '',
  }
}

async function getAuth(credentials: GCPCredentials) {
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })
}

describe('GoogleSheetsRepository — integration', () => {
  let auth: Awaited<ReturnType<typeof getAuth>>
  const credentials = makeCred()
  const range = process.env.GCP_LEAD_SPREADSHEET_RANGE ?? ''
  const spreadsheetId = process.env.GCP_LEAD_SPREADSHEET_ID ?? ''

  const entityContext = {
    declareEntity: jest.fn(),
    createMeta: jest.fn(),
    validateEntity: jest.fn().mockImplementation(() => true),
  } as any as jest.Mocked<EntityContext>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  beforeAll(async () => {
    auth = await getAuth(credentials)
  })

  it('should append an entity and then clean it up', async () => {
    const repo = GoogleSheetsRepository<En>({
      credentials,
      range,
      spreadsheetId,
      entityContext,
      tag: EnURI,
    })

    const now = new Date()
    const meta: EntityMeta = {
      id: `itest-${now.getTime()}}`,
      _r: 'entity',
      created_at: now,
      updated_at: now,
      _idempotency_key: '',
    }

    const entity = createEn({
      name: 'Integration Test',
      value: 123,
      tags: ['some tag'],
    })

    entityContext.declareEntity.mockResolvedValueOnce(
      entity._b(entity.props, meta),
    )

    const result = await repo.methods.set(entity)

    expect(result).toBeDefined()
    expect(result.meta.id).toBe(meta.id)

    const found = await getLastValue(auth, spreadsheetId, range)
    expect(found).toBeDefined()

    expect(JSON.stringify(found)).toEqual(
      expect.stringContaining(result.meta.id),
    )
    expect(JSON.stringify(found)).toEqual(
      expect.stringContaining(result.meta.created_at.toISOString()),
    )
    expect(JSON.stringify(found)).toEqual(
      expect.stringContaining(result.meta.updated_at.toISOString()),
    )
    expect(JSON.stringify(found)).toEqual(
      expect.stringContaining(result.props.name),
    )
    expect(JSON.stringify(found)).toEqual(
      expect.stringContaining(result.props.value.toString()),
    )
  })
})
