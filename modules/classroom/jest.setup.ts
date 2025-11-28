jest.mock('./src/utils/get.duration.ts', () => ({
  getDuration: jest.fn(() => 12 * 1000),
}))
