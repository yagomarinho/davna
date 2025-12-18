/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { google } from 'googleapis'
import { GCPCredentials } from './gcp.credentials'

export async function getRowsCount(
  auth: Awaited<ReturnType<typeof GCPAuth>>,
  spreadsheetId: string,
  range: string,
) {
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  const rows = res.data.values ?? []
  return rows.length
}

export async function GCPAuth(credentials: GCPCredentials) {
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })
}
