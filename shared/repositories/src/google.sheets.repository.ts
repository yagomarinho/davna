import { google } from 'googleapis'

import { applyTag, Entity, Writable, Repository } from '@davna/core'

export interface Credentials {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
  universe_domain: string
}

export interface GCPConfig {
  spreadsheetId: string
  range: string
  credentials: Credentials
}

export function GoogleSheetsRepository<E extends Entity>({
  spreadsheetId,
  range,
  credentials,
}: GCPConfig): Writable<Repository<E>> {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })

  const set: Repository<E>['set'] = async (entity: E) => {
    const sheets = google.sheets({ version: 'v4', auth })

    const requestBody = {
      values: [Object.values(entity).map(value => JSON.stringify(value))],
    }

    // Append the values to the spreadsheet.
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody,
    })

    if (!result.data.updates?.updatedRows)
      throw new Error('Invalid data to update')

    return entity
  }

  return applyTag('repository')({
    set,
  })
}
