import { Storage, STORAGE_TYPE } from '@davna/providers'
import { readFileAsBuffer } from '../utils/read.file.as.buffer'
import { resolve } from 'node:path'

export function makeStorage() {
  let n = 0
  const ids: string[] = []

  return ({ tempDir }): Storage => {
    const check: Storage['check'] = async id => ids.includes(id)

    const download: Storage['download'] = async ({ identifier }) => {
      if (ids.includes(identifier))
        return readFileAsBuffer(resolve(tempDir, 'audiotest.m4a'))
    }

    const upload: Storage['upload'] = async () => {
      const id = (n++).toString()
      ids.push(id)
      return {
        identifier: id,
        storage_type: STORAGE_TYPE.MONGO_GRIDFS,
      }
    }

    return {
      check,
      download,
      upload,
    }
  }
}
