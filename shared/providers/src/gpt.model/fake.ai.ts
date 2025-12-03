import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { generateSilentWavBuffer } from '@davna/utils'

import { GPTModel } from './gpt.model'

export interface FakeAIConfig {
  textToRespond: string
  pathToSpeech: string
  textFromSpeech: string
}

export function FakeAI({
  textToRespond,
  pathToSpeech,
  textFromSpeech,
}: FakeAIConfig): GPTModel {
  const respond: GPTModel['respond'] = async () => textToRespond

  const transcribe: GPTModel['transcribe'] = async () => textFromSpeech

  const synthesize: GPTModel['synthesize'] = async () => {
    try {
      const exists = existsSync(pathToSpeech)

      if (!exists) throw ''

      return readFile(pathToSpeech, { flag: 'r' })
    } catch {
      await wait(100) // necessário para tornar a branch assincrono

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

function wait(milis: number = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, milis)
  })
}
