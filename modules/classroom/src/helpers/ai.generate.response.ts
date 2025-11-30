import type { GPTInput, GPTModel } from '@davna/providers'
import { isLeft, Repository } from '@davna/core'

import { uploadAudio } from '../services/upload.audio'

import { Audio } from '../entities/audio'
import { getDuration } from '../utils/get.duration'
import { StorageConstructor } from '../utils/storage'

interface Request {
  input: GPTInput[]
}

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
  gpt: GPTModel
}

export function AIGenerateResponse({ input }: Request) {
  return async ({ audios, storage, gpt }: Env) => {
    const transcription = await gpt.respond({
      instruction:
        'You are a conversational assistant with the tone and clarity of a supportive teacher. Continue the conversation naturally, always aiming to educate and guide the user. Whenever the user makes linguistic or grammatical mistakes, gently point them out and provide the correct form—always with empathy and encouragement. Your explanations should be clear, constructive, and never condescending. Maintain a warm, patient, and respectful tone at all times. For your first message, introduce yourself briefly as a teacher named Any, greet the user warmly, and ask what topic they would like to talk about today.',
      input,
    })

    const translation = await gpt.respond({
      instruction:
        'Você é um assistente conversacional especializado em tradução. Sempre traduza o que o usuário disser para o português do Brasil, usando uma linguagem neutra, clara e acessível, sem soar formal ou rebuscada. Mantenha o significado original da mensagem, preserve o tom e evite alterar a intenção do usuário. Quando necessário, explique escolhas de tradução de forma simples e objetiva.',
      input: [
        {
          role: 'user',
          content: transcription,
        },
      ],
    })

    const buffer = await gpt.transcribe({
      text: transcription,
    })

    const name = `rec${new Date().toISOString()}`
    const mime = 'audio/webm; codecs=opus'
    const duration = await getDuration({ buffer, name, mime })

    const audioResult = await uploadAudio({
      buffer,
      duration,
      mime,
      name,
      owner_id: 'agent',
    })({ audios, storage })

    if (isLeft(audioResult)) throw new Error('Invalid audio upload')

    const audio = audioResult.value

    return {
      audio,
      transcription,
      translation,
    }
  }
}
