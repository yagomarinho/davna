import { Metadata } from '@davna/kernel'

export interface ContentData {
  content: string
  metadata: Metadata
}
export interface Content {
  type: string
  data: ContentData
}
