import OpenAI from 'openai'

import { createReadStream } from 'node:fs'
import { rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Repository } from '../../../shared/core/repository'
import { Audio } from '../entities/audio'
import { StorageConstructor } from '../../../shared/providers/storage/storage'

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
}

export function getTranscriptionFromAudio(audio_id: string) {
  return async ({ audios, storage }: Env) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // O servidor precisa gerar a transcrição e a tradução do áudio para o português
    const audio = await audios.get(audio_id)

    if (!audio) throw new Error('No audio founded')

    const buffer = await storage({
      driver: audio.internal_ref.storage,
    }).download({
      identifier: audio.internal_ref.identifier,
    })

    if (!buffer) throw new Error('No audio founded on storage')

    const relativeTempPath = process.env.RELATIVE_TMP_DIR_PATH || ''
    const dirPath = resolve(__dirname, relativeTempPath)

    const path = resolve(
      dirPath,
      `${audio.name}.${audio.mime.replace('audio/', '')}`,
    )

    await writeFile(path, buffer, { flag: 'w' })

    const transcript = await openai.audio.transcriptions.create({
      file: createReadStream(path),
      model: 'gpt-4o-transcribe',
    })

    const response = await openai.responses.create({
      metadata: { topic: 'demo' },
      model: 'o4-mini',
      input: [
        {
          role: 'developer',
          content:
            'Você é um assistente que faz tradução de textos em inglês para textos em português BR, faça uma tradução fiel ao idioma nativo com uma linguagem mais neutra possível',
        },
        {
          role: 'user',
          content: `traduza o seguinte texto: \n${transcript.text}`,
        },
      ],
    })

    // apagar o arquivo temp
    rm(path)

    const transcription = transcript.text
    const translation = response.output_text

    return {
      buffer,
      transcription,
      translation,
    }
  }
}
