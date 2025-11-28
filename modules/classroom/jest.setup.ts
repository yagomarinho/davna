import { getDuration as getDurationUtil } from './src/utils/get.duration'

jest.mock('./src/utils', () => ({
  getDuration: jest.fn(() => 12 * 1000),
}))

export const getDuration = getDurationUtil as jest.Mock
