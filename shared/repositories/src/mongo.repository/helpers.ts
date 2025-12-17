import { Document, MongoClient, ObjectId } from 'mongodb'
import { MongoDocument } from './converter'

export function fromDocument({ _id, ...data }: Document): MongoDocument {
  return {
    id: _id.toString(),
    data,
  }
}

export function toDocument({ id, data }: MongoDocument): Document {
  return {
    _id: mongoId(id),
    ...data,
  }
}

export function mongoId(id: string) {
  return new ObjectId(id)
}

export async function isConnected(client?: MongoClient) {
  if (!client || !client.db()) {
    return false
  }
  try {
    const res = await client.db().admin().ping()
    return res.ok === 1
  } catch {
    return false
  }
}
