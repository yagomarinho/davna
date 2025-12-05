import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { generateSilentWavBuffer, wait } from '@davna/utils'

import { GPTModel } from './gpt.model'

export interface FakeAIConfig {
  textToRespond: string
  pathToSpeech: string
  textFromSpeech: string
  milis?: number
}

export function FakeAI({
  textToRespond,
  pathToSpeech,
  textFromSpeech,
  milis = 1000,
}: FakeAIConfig): GPTModel {
  const respond: GPTModel['respond'] = async () => {
    await wait(milis)
    return textToRespond
  }

  const transcribe: GPTModel['transcribe'] = async () => {
    await wait(milis)
    return textFromSpeech
  }

  const synthesize: GPTModel['synthesize'] = async () => {
    try {
      const exists = existsSync(pathToSpeech)

      if (!exists) throw ''

      await wait(milis)
      return readFile(pathToSpeech, { flag: 'r' })
    } catch {
      await wait(milis)

      // fallback WAV
      // gerado com IA
      const wavBuffer = generateSilentWavBuffer({
        seconds: 2,
        sampleRate: 44100,
        channels: 1,
        bitDepth: 16,
      })
      return wavBuffer
    }
  }

  return {
    respond,
    transcribe,
    synthesize,
  }
}
