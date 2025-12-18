/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, EntityContext, ExtractEntityTag } from '@davna/core'
import { GCPCredentials } from './gcp.credentials'

/**
 * Configuration interface for a Google Sheets repository.
 *
 * Encapsulates all parameters required to connect to a GSheets
 * backend and manage entities of a specific type.
 *
 * - E: the entity type handled by the repository
 */

export interface GSRepoConfig<E extends Entity> {
  /** GCP service account credentials for authentication */
  credentials: GCPCredentials

  /** ID of the target spreadsheet */
  spreadsheetId: string

  /** Cell range within the spreadsheet to operate on */
  range: string

  /** Context provider for entity metadata and validation */
  entityContext?: EntityContext

  /** Tag identifying the kind of entity stored in this repository */
  tag: ExtractEntityTag<E>
}
