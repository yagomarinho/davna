import { Tagged } from '@davna/core'

export const OcursInURI = 'occurs-in'
export type OcursInURI = typeof OcursInURI

export interface OccursIn extends Tagged<OcursInURI> {
  classroom_id: string
  message_id: string
}
