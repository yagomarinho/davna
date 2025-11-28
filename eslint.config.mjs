import config from '@davna/eslint'

export default [
  ...config,
  {
    ignores: ['/**/*.js', '/**/*.mjs', '*.js'],
  },
]
