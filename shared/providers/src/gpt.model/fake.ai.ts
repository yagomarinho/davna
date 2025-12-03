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

  const synthesize: GPTModel['synthesize'] = async () => {
    try {
      const file = await readFile(pathToSpeech, { flag: 'r' })

      if (file) return file

      throw ''
    } catch {
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

// fallback-wav.js
// Gera um Buffer contendo um WAV válido com 2s de silêncio (16-bit PCM, 44100 Hz, mono).

function generateSilentWavBuffer({
  seconds = 2,
  sampleRate = 44100,
  channels = 1,
  bitDepth = 16,
} = {}) {
  // cálculos
  const bytesPerSample = bitDepth / 8
  const totalSamples = Math.floor(seconds * sampleRate)
  const dataByteLength = totalSamples * channels * bytesPerSample
  const headerByteLength = 44 // cabeçalho PCM WAV padrão
  const buffer = Buffer.alloc(headerByteLength + dataByteLength)

  // RIFF header
  buffer.write('RIFF', 0) // ChunkID
  buffer.writeUInt32LE(headerByteLength - 8 + dataByteLength, 4) // ChunkSize = 36 + Subchunk2Size
  buffer.write('WAVE', 8) // Format

  // fmt subchunk
  buffer.write('fmt ', 12) // Subchunk1ID
  buffer.writeUInt32LE(16, 16) // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20) // AudioFormat 1 = PCM
  buffer.writeUInt16LE(channels, 22) // NumChannels
  buffer.writeUInt32LE(sampleRate, 24) // SampleRate
  const byteRate = sampleRate * channels * bytesPerSample
  buffer.writeUInt32LE(byteRate, 28) // ByteRate
  const blockAlign = channels * bytesPerSample
  buffer.writeUInt16LE(blockAlign, 32) // BlockAlign
  buffer.writeUInt16LE(bitDepth, 34) // BitsPerSample

  // data subchunk
  buffer.write('data', 36) // Subchunk2ID
  buffer.writeUInt32LE(dataByteLength, 40) // Subchunk2Size

  // PCM data: já inicializado com zeros -> silêncio
  // (se quisesse som, escreveríamos amostras aqui)

  return buffer
}
