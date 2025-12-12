import { GCPCredentials, GoogleSheetsRepository } from '@davna/repositories'
import { Suggestion } from '../entities/suggestion'

interface SuggestionRepositoryConfig {
  credentials?: GCPCredentials
  range?: string
  spreadsheetId?: string
}

export const SuggestionRepository = ({
  credentials,
  spreadsheetId = process.env.GCP_SUGGESTION_SPREADSHEET_ID!,
  range = process.env.GCP_SUGGESTION_SPREADSHEET_RANGE!,
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
  })
}
