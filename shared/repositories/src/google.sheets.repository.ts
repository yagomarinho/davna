/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { google } from 'googleapis'
import { Entity, Writable, Repository, EntityContext } from '@davna/core'

export interface GCPCredentials {
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
  credentials: GCPCredentials
  spreadsheetId: string
  range: string
  entityContext: EntityContext
}

export function GoogleSheetsRepository<E extends Entity>({
  spreadsheetId,
  range,
  credentials,
  entityContext,
}: GCPConfig): Writable<Repository<E>> {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })

  const set: Repository<E>['methods']['set'] = async entity => {
    const sheets = google.sheets({ version: 'v4', auth })

    const meta = entityContext.meta()
    const { id, created_at, updated_at } = meta

    const props = {
      id,
      ...entity.props,
      created_at,
      updated_at,
    }

    const requestBody = {
      values: [Object.values(props).map(value => JSON.stringify(value))],
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

    return { ...entity, meta }
  }

  return {
    _t: '',
    set,
  }
}
