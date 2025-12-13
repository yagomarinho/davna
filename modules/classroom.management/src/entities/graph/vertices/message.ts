import { Entity } from '@davna/core'

export const MessageURI = 'message'
export type MessageURI = typeof MessageURI

export interface Message extends Entity<MessageURI> {}
