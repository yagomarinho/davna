import { google } from 'googleapis'

import { Entity } from '../core/entity'
import { Repository, Writable } from '../core/repository'
import { applyTag } from '../core/tagged'
import config from '../../config'

export interface Config {
  spreadsheetId: string
  range: string
  credentials: typeof config.providers.gcp.credentials
}

export function GoogleSheetsRepository<E extends Entity>({
  spreadsheetId,
  range,
  credentials,
}: Config): Writable<Repository<E>> {
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
