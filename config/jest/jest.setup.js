const dotenv = require('dotenv')
const { resolve } = require('node:path')

dotenv.config({ path: resolve(__dirname, '../../', '.env'), quiet: true })

module.exports = {}
