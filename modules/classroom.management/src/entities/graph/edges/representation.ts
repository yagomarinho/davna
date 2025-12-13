import { Tagged } from '@davna/core'
import {
  AudioURI,
  ClassroomURI,
  MessageURI,
  ParticipantURI,
  TextURI,
} from '../vertices'

export const RepresentationURI = 'representation'
export type RepresentationURI = typeof RepresentationURI

export interface Representation extends Tagged<RepresentationURI> {
  text_id: string
  resource_id: string
  resource_type: ClassroomURI | MessageURI | AudioURI | TextURI | ParticipantURI
}
