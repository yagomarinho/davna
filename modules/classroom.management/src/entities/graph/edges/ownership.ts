import { Tagged } from '@davna/core'
import { AudioURI, ClassroomURI, MessageURI, TextURI } from '../vertices'

export const OwnershipURI = 'ownership'
export type OwnershipURI = typeof OwnershipURI

export interface Ownership extends Tagged<OwnershipURI> {
  participant_id: string
  resource_id: string
  resource_type: ClassroomURI | MessageURI | AudioURI | TextURI
}
