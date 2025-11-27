import config from '../../../../config'
import { ChatGPT, Config as ChatGPTConfig } from './chatgpt'
import { FakeAI, Config as FakeAIConfig } from './fake.ai'
import { GPTModel } from './gpt'

export enum GPT_DRIVER {
  CHATGPT = 'chatgpt',
  FAKEAI = 'fake.ai',
}

const DEFAULT_GPT_DRIVER =
  process.env.NODE_ENV === 'production' ? GPT_DRIVER.CHATGPT : GPT_DRIVER.FAKEAI

export function GPT(): GPTModel
export function GPT(data: {
  driver?: 'fake.ai'
  options?: FakeAIConfig
}): GPTModel
export function GPT(data: {
  driver: 'chatgpt'
  options?: ChatGPTConfig
}): GPTModel

export function GPT({ driver = DEFAULT_GPT_DRIVER, options }: any = {}) {
  const opt = options || config.providers.gpt[driver]

  const drivers = {
    [GPT_DRIVER.CHATGPT]: ChatGPT,
    [GPT_DRIVER.FAKEAI]: FakeAI,
  }

  return drivers[driver](opt)
}
