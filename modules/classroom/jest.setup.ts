import { getDuration as getDurationUtil } from './src/utils'

jest.mock('./src/utils', () => ({
  getDuration: jest.fn(() => 12 * 1000),
}))

export const getDuration = getDurationUtil as jest.Mock
