import { Storage, STORAGE_TYPE } from '@davna/providers'
import { readFileAsBuffer } from '../utils/read.file.as.buffer'
import { resolve } from 'node:path'
import { generateSilentWavBuffer } from '@davna/utils'
import { existsSync } from 'node:fs'

export function makeStorage() {
  let n = 0
  const ids: string[] = []

  return ({ tempDir }): Storage => {
    const check: Storage['check'] = async id => ids.includes(id)

    const download: Storage['download'] = async ({ identifier }) => {
      if (ids.includes(identifier)) {
        const path = resolve(tempDir, 'audiotest.m4a')

        const exists = existsSync(path)

        return exists
          ? readFileAsBuffer(path)
          : generateSilentWavBuffer({
              seconds: 2,
              sampleRate: 44100,
              channels: 1,
              bitDepth: 16,
            })
      }
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
