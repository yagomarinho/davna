import { readFile } from 'node:fs/promises'
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

  const synthesize: GPTModel['synthesize'] = async () =>
    readFile(pathToSpeech, { flag: 'r' })

  return {
    respond,
    transcribe,
    synthesize,
  }
}
