import config from '../../../config'
import { GoogleSheetsRepository } from '../../../shared/repositories/google.sheets.repository'
import { Lead } from '../entities/lead'

interface Config {
  credentials?: typeof config.providers.gcp.credentials
  range?: string
  spreadsheetId?: string
}

export const LeadRepository = ({
  credentials = config.providers.gcp.credentials,
  spreadsheetId = config.providers.gcp.sheets.spreadsheetId,
  range = config.providers.gcp.sheets.range,
}: Config = {}) =>
  GoogleSheetsRepository<Lead>({
    credentials,
    range,
    spreadsheetId,
  })
