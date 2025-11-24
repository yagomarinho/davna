import OpenAI from 'openai'

import { getDuration } from '../../../shared/utils/get.duration'
import { isLeft } from '../../../shared/core/either'
import { Repository } from '../../../shared/core/repository'

import { uploadAudio } from '../services/upload.audio'

import { Audio } from '../entities/audio'
import { StorageConstructor } from '../../../shared/providers/storage/storage'

interface Request {
  input: OpenAI.Responses.ResponseInput
}

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
}

export function AIGenerateResponse({ input }: Request) {
  return async ({ audios, storage }: Env) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // mandar o GPT gerar a resposta em inglês
    const transcriptionResponse = await openai.responses.create({
      metadata: { topic: 'demo' },
      model: 'o4-mini',
      input: [
        {
          role: 'system',
          content:
            'You are a conversational assistant with the tone and clarity of a supportive teacher. Continue the conversation naturally, always aiming to educate and guide the user. Whenever the user makes linguistic or grammatical mistakes, gently point them out and provide the correct form—always with empathy and encouragement. Your explanations should be clear, constructive, and never condescending. Maintain a warm, patient, and respectful tone at all times. For your first message, introduce yourself briefly as a teacher named Any, greet the user warmly, and ask what topic they would like to talk about today.',
        } as any,
      ].concat(input),
    })

    const transcription = transcriptionResponse.output_text

    // Gerar uma tradução a partir da resposta
    const translationResponse = await openai.responses.create({
      metadata: { topic: 'demo' },
      model: 'o4-mini',
      input: [
        {
          role: 'system',
          content:
            'Você é um assistente conversacional especializado em tradução. Sempre traduza o que o usuário disser para o português do Brasil, usando uma linguagem neutra, clara e acessível, sem soar formal ou rebuscada. Mantenha o significado original da mensagem, preserve o tom e evite alterar a intenção do usuário. Quando necessário, explique escolhas de tradução de forma simples e objetiva.',
        } as any,
        {
          role: 'user',
          content: transcription,
        },
      ],
    })

    const translation = translationResponse.output_text

    // Gerar um áudio para servir de voz para o teacher
    const mp3 = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      response_format: 'opus',
      voice: 'alloy',
      input: transcription,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    const duration = await getDuration({ buffer })

    const audioResult = await uploadAudio({
      buffer,
      duration,
      mime: 'audio/webm; codecs=opus',
      name: `rec${new Date().toISOString()}`,
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
