import { existsSync } from 'node:fs'

export interface Options {
  candidates: string[]
  early?: boolean
  errorMessage?: string
}

type WithoutEarly = Omit<Options, 'early'>
interface EarlyTrue extends Options {
  early: true
}
interface EarlyFalse extends Options {
  early: false
}

export function ensurePath(data: WithoutEarly | EarlyTrue): string
export function ensurePath(data: EarlyFalse): string | undefined
export function ensurePath({
  candidates,
  early = true,
  errorMessage = "This file doesn't exists in this candidates",
}: Options) {
  const path = candidates.find(p => typeof p === 'string' && existsSync(p))

  if (early && !path) {
    throw new Error(errorMessage)
  }

  return path
}
