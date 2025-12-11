import { google } from 'googleapis'
import { applyTag, applyVersioning, Entity } from '@davna/core'
import { OmitEntityProps } from '@davna/types'

import {
  GCPCredentials,
  GoogleSheetsRepository,
} from '../google.sheets.repository'

jest.setTimeout(30000)

interface E extends Entity<'E', 'v1'> {
  name: string
  value: number
}

interface CreateE extends OmitEntityProps<E>, Partial<Entity> {
  id: string
}

function E(
  id: string,
  name: string,
  value: number,
  created_at: Date,
  updated_at: Date,
): E {
  return applyVersioning('v1')(
    applyTag('E')({
      id,
      name,
      value,
      created_at,
      updated_at,
    }),
  )
}

E.create = ({ id, name, value, created_at, updated_at }: CreateE) => {
  const now = new Date()

  return E(id, name, value, created_at ?? now, updated_at ?? now)
}

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
  const range = process.env.GCP_SPREADSHEET_RANGE ?? ''
  const spreadsheetId = process.env.GCP_SPREADSHEET_ID ?? ''

  beforeAll(async () => {
    auth = await getAuth(credentials)
  })

  it('should append an entity and then clean it up', async () => {
    const repo = GoogleSheetsRepository<E>({
      credentials,
      range,
      spreadsheetId,
    })

    const uniqueId = `itest-${Date.now()}}`
    const entity: E = E.create({
      id: uniqueId,
      name: 'Integration Test',
      value: 123,
    })

    const result = await repo.set(entity)

    expect(result).toBeDefined()
    expect(result.id).toBe(uniqueId)

    const found = await getLastValue(auth, spreadsheetId, range)
    expect(found).toBeDefined()

    expect(found).toEqual(
      expect.arrayContaining(
        Object.values(result).map(value => JSON.stringify(value)),
      ),
    )
  })
})
