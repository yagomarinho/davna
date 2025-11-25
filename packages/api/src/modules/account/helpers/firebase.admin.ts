import * as admin from 'firebase-admin/app'
import config from '../../../config'

const DEFAULT_SERVICE_ACCOUNT = config.providers.firebaseAdmin.credentials

export function firebaseAdmin(
  credential: any = DEFAULT_SERVICE_ACCOUNT,
  name?: string,
) {
  try {
    return admin.initializeApp(
      {
        credential: admin.cert(credential),
      },
      name,
    )
  } catch {
    return admin.getApp(name)
  }
}
