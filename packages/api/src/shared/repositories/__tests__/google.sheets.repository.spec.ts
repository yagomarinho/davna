import { google } from 'googleapis'

import config from '../../../config'

import { GoogleSheetsRepository } from '../google.sheets.repository'

import { Entity } from '../../core/entity'
import { applyTag } from '../../core/tagged'
import { OmitEntityProps } from '../../types/omit.entity'

jest.setTimeout(30000)

interface E extends Entity<'E'> {
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
  return applyTag('E')({
    id,
    name,
    value,
    created_at,
    updated_at,
  })
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

async function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: config.providers.gcp.credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })
}

describe('GoogleSheetsRepository — integration', () => {
  let auth: Awaited<ReturnType<typeof getAuth>>

  beforeAll(async () => {
    auth = await getAuth()
  })

  it('should append an entity and then clean it up', async () => {
    const repo = GoogleSheetsRepository<E>({
      ...config.providers.gcp.sheets,
      credentials: config.providers.gcp.credentials,
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

    const { spreadsheetId, range } = config.providers.gcp.sheets

    const found = await getLastValue(auth, spreadsheetId, range)
    expect(found).toBeDefined()

    expect(found).toEqual(
      expect.arrayContaining(
        Object.values(result).map(value => JSON.stringify(value)),
      ),
    )
  })
})
