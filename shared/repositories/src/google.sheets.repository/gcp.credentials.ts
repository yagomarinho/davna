/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Google Cloud Platform (GCP) service account credentials.
 *
 * Used to authenticate and authorize access to GCP services,
 * such as Google Sheets, Cloud Storage, or Firestore.
 */

export interface GCPCredentials {
  /** Type of the credentials (usually 'service_account') */
  type: string

  /** GCP project identifier */
  project_id: string

  /** Private key identifier */
  private_key_id: string

  /** Private key used for signing requests */
  private_key: string

  /** Service account email */
  client_email: string

  /** Client ID of the service account */
  client_id: string

  /** OAuth2 authorization URI */
  auth_uri: string

  /** OAuth2 token URI */
  token_uri: string

  /** URL to the provider's x509 certificate */
  auth_provider_x509_cert_url: string

  /** URL to the client's x509 certificate */
  client_x509_cert_url: string

  /** GCP universe domain (typically 'googleapis.com') */
  universe_domain: string
}
