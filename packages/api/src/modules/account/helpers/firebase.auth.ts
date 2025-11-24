import { App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { firebaseAdmin } from './firebase.admin'

export function firebaseAuth(app: App = firebaseAdmin()) {
  return getAuth(app)
}
