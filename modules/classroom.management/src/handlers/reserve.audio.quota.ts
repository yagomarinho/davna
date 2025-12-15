import { Handler } from '@davna/core'
import { Audio } from '../entities'

interface Data {
  estimated_duration: number
  tolerance_ratio?: number // entre 0 e 1
}

interface Metadata {}

interface Env {}

export const reserveAudioQuota = Handler<Env, Data, Metadata>(
  request => env => {
    // O que eu preciso fazer aqui nessa parte?
    // Vai criar um áudio em modo draft

    const audio = Audio.presigned()
  },
)
