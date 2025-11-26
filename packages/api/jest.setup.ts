import 'dotenv/config'
import { getDuration as getDurationHelper } from './src/shared/utils/get.duration'

jest.mock('./src/shared/utils/get.duration', () => ({
  getDuration: jest.fn(),
}))

const getDuration = getDurationHelper as jest.Mock

getDuration.mockImplementation(() => 120)
