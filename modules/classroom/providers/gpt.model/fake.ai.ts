import { readFile } from 'node:fs/promises'
import { GPTModel } from './gpt'

export interface Config {
  textToRespond: string
  pathToSpeech: string
  textFromSpeech: string
}

export function FakeAI({
  textToRespond,
  pathToSpeech,
  textFromSpeech,
}: Config): GPTModel {
  const respond: GPTModel['respond'] = async () => textToRespond

  const transcribe: GPTModel['transcribe'] = async () =>
    readFile(pathToSpeech, { flag: 'r' })

  const synthesize: GPTModel['synthesize'] = async () => textFromSpeech

  return {
    respond,
    transcribe,
    synthesize,
  }
}
