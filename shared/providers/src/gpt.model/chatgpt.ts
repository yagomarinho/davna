import OpenAI from 'openai'
import { GPTModel } from './gpt.model'
import { createReadStream } from 'fs'

export interface ChatGPTConfig {
  apiKey?: string
}

export function ChatGPT({
  apiKey = process.env.OPENAI_API_KEY,
}: ChatGPTConfig): GPTModel {
  const openai = new OpenAI({
    apiKey,
  })

  const respond: GPTModel['respond'] = async ({ instruction, input }) => {
    const response = await openai.responses.create({
      metadata: { topic: 'demo' },
      model: 'o4-mini',
      input: [{ role: 'system', content: instruction }, ...input],
    })

    return response.output_text
  }

  const transcribe: GPTModel['transcribe'] = async ({ text }) => {
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      response_format: 'opus',
      voice: 'alloy',
      input: text,
    })

    return Buffer.from(await response.arrayBuffer())
  }

  const synthesize: GPTModel['synthesize'] = async ({ path }) => {
    const response = await openai.audio.transcriptions.create({
      file: createReadStream(path),
      model: 'gpt-4o-transcribe',
    })

    return response.text
  }

  return {
    respond,
    transcribe,
    synthesize,
  }
}
