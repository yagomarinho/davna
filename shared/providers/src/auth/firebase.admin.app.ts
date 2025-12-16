/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as admin from 'firebase-admin/app'

export interface FirebaseCredentials {
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

export function firebaseAdmin(
  credentials?: FirebaseCredentials,
  name?: string,
) {
  const DEFAULT_CREDENTIALS = {
    type: process.env.FIREBASE_ADMIN_TYPE ?? '',
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID ?? '',
    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID ?? '',
    private_key:
      process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? '',
    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID ?? '',
    auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI ?? '',
    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI ?? '',
    auth_provider_x509_cert_url:
      process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL ?? '',
    client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL ?? '',
    universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN ?? '',
  }

  const c: FirebaseCredentials = credentials || DEFAULT_CREDENTIALS

  try {
    return admin.initializeApp({ credential: admin.cert(c as any) }, name)
  } catch (e) {
    if (e instanceof admin.FirebaseAppError) {
      if (e.code !== 'app/invalid-credential') return admin.getApp(name)
    }
    throw e
  }
}
