/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type UserInput = { role: 'user'; content: string }
export type AssistantInput = { role: 'assistant'; content: string }

export type GPTInput = UserInput | AssistantInput

export interface Respond {
  instruction: string
  input: GPTInput[]
}

export interface Synthesize {
  text: string
}
export interface Transcribe {
  path: string
}

export interface GPTModel {
  readonly respond: (data: Respond) => Promise<string>
  readonly transcribe: (data: Transcribe) => Promise<string>
  readonly synthesize: (data: Synthesize) => Promise<Buffer<ArrayBufferLike>>
}
