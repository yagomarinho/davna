import { resolve } from 'node:path'
import { rm, writeFile } from 'node:fs/promises'

import { GPTModel } from '@davna/providers'

import { Repository } from '@davna/core'
import { Audio } from '../entities/audio'

interface Env {
  audios: Repository<Audio>
  storage: StorageConstructor
  gpt: GPTModel
}

export function getTranscriptionFromAudio(audio_id: string) {
  return async ({ audios, storage, gpt }: Env) => {
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

    const transcription = await gpt.synthesize({
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

    // apagar o arquivo temp
    rm(path)

    return {
      buffer,
      transcription,
      translation,
    }
  }
}
