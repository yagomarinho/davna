import config from '@davna/jest'

export default {
  ...config,
  setupFiles: [...config.setupFiles!, '<rootDir>/jest.setup.ts'],
}
