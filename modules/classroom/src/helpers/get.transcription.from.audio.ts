import type { GPTModel } from '@davna/providers'
import { resolve } from 'node:path'
import { rm, writeFile } from 'node:fs/promises'
import { Repository } from '@davna/core'

import { Audio } from '../entities/audio'
import { StorageConstructor } from '../utils/storage'

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
  gpt: GPTModel
  tempDir: string
}

export function getTranscriptionFromAudio(audio_id: string) {
  return async ({ audios, storage, gpt, tempDir }: Env) => {
    const audio = await audios.get(audio_id)

    if (!audio) throw new Error('No audio founded')

    const buffer = await storage({
      driver: audio.internal_ref.storage,
    }).download({
      identifier: audio.internal_ref.identifier,
    })

    if (!buffer) throw new Error('No audio founded on storage')

    const path = resolve(
      tempDir,
      `${audio.name}.${audio.mime.replace('audio/', '')}`,
    )

    await writeFile(path, buffer, { flag: 'w' })

    const transcription = await gpt.transcribe({
      path,
    })

    const translation = await gpt.respond({
      instruction:
        'Você é um assistente que faz tradução de textos em inglês para textos em português BR, faça uma tradução fiel ao idioma nativo com uma linguagem mais neutra possível',
      input: [
        {
          role: 'user',
          content: `traduza o seguinte texto: \n${transcription}`,
        },
      ],
    })

    rm(path)

    return {
      buffer,
      transcription,
      translation,
    }
  }
}
