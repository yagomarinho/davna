/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GCPCredentials, GoogleSheetsRepository } from '@davna/infra'
import { Suggestion, SuggestionURI } from '../entities/suggestion'
import { EntityContext } from '@davna/core'

interface SuggestionRepositoryConfig {
  credentials?: GCPCredentials
  range?: string
  spreadsheetId?: string
  entityContext?: EntityContext
}

export const SuggestionRepository = ({
  credentials,
  spreadsheetId = process.env.GCP_SUGGESTION_SPREADSHEET_ID!,
  range = process.env.GCP_SUGGESTION_SPREADSHEET_RANGE!,
  entityContext,
}: SuggestionRepositoryConfig = {}) => {
  const DEFAULT_CREDENTIALS = {
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

  return GoogleSheetsRepository<Suggestion>({
    credentials: credentials || DEFAULT_CREDENTIALS,
    range,
    spreadsheetId,
    tag: SuggestionURI,
    entityContext,
  })
}
