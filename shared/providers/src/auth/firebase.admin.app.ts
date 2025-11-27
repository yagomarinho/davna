import * as admin from 'firebase-admin/app'

export interface Credentials {
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

const DEFAULT_CREDENTIALS = {
  type: process.env.FIREBASE_ADMIN_TYPE!,
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID!,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID!,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY!,
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID!,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI!,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI!,
  auth_provider_x509_cert_url:
    process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL!,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL!,
  universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN!,
}

export function firebaseAdmin(
  credentials: Credentials = DEFAULT_CREDENTIALS,
  name?: string,
) {
  try {
    return admin.initializeApp(
      {
        credential: admin.cert(credentials as any),
      },
      name,
    )
  } catch {
    return admin.getApp(name)
  }
}
