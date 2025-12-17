/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { google } from 'googleapis'
import { Entity, Writable, Repository } from '@davna/core'

import { GSRepoConfig } from './gsr.config'
import { serializeEntity } from './serialize.entity'

/**
 * Resource identifier for Google Sheets repositories.
 *
 * Used to discriminate this type of repository from other
 * repository implementations at runtime.
 */

export const GoogleSheetsRepositoryURI = 'google.sheets.repo'
export type GoogleSheetsRepositoryURI = typeof GoogleSheetsRepositoryURI

/**
 * Factory function to create a Google Sheets-backed repository.
 *
 * Provides write-only access to entities using the Google Sheets API.
 * Currently only supports the `set` operation for appending rows.
 *
 * - E: the entity type stored in the repository
 *
 * Parameters:
 * - spreadsheetId: ID of the target Google Sheet
 * - range: cell range within the spreadsheet to operate on
 * - credentials: GCP service account credentials
 * - entityContext: provider for generating entity metadata
 * - tag: entity tag (URI) for type identification
 *
 * Returns:
 * - a repository instance with write-only capabilities
 *   (Writable<Repository<E, GoogleSheetsRepositoryURI>>)
 */

export function GoogleSheetsRepository<E extends Entity>({
  spreadsheetId,
  range,
  credentials,
  entityContext,
  tag,
}: GSRepoConfig<E>): Writable<Repository<E, GoogleSheetsRepositoryURI>> {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })

  const set: Repository<E>['methods']['set'] = async entity => {
    const sheets = google.sheets({ version: 'v4', auth })

    const meta = await entityContext.meta()
    const requestBody = {
      values: [serializeEntity({ ...entity, meta })],
    }

    // Append the serialized entity values as a new row in the sheet
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody,
    })

    if (!result.data.updates?.updatedRows)
      throw new Error('Invalid data to update')

    // Return the fully built entity with metadata
    return entity._b(entity.props, meta) as any
  }

  return {
    _t: tag,
    meta: { _r: 'repository', _t: GoogleSheetsRepositoryURI },
    methods: {
      set,
    },
  }
}
