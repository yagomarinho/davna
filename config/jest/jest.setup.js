const dotenv = require('dotenv')
const { resolve } = require('node:path')

dotenv.config({ path: resolve(__dirname, '../../', '.env'), quiet: true })

jest.mock('../../modules/classroom/src/utils/get.duration.ts', () => ({
  getDuration: jest.fn(() => Math.random()),
}))

module.exports = {}
