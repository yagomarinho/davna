/* eslint-disable no-console */
// monitor-build.js
import { spawn } from 'child_process'
import os from 'os'

console.log('🚀 Iniciando build com monitoramento de memória...\n')

const start = Date.now()
let maxMem = 0

// Inicia o processo do build (usando o shell para suportar 'yarn build')
const build = spawn('yarn', ['workspace', '@davna/api', 'run', 'build'], {
  shell: true,
  stdio: 'inherit',
})

// Cria um intervalo para monitorar a memória do processo Node (e sistema)
const interval = setInterval(() => {
  const mem = process.memoryUsage().rss / 1024 / 1024 // MB
  if (mem > maxMem) maxMem = mem
}, 500)

// Quando o build terminar:
build.on('close', code => {
  clearInterval(interval)
  const end = Date.now()
  const duration = ((end - start) / 1000).toFixed(2)

  console.log('\n📊  Relatório do build:')
  console.log(`⏱️  Duração total: ${duration}s`)
  console.log(`💾  Pico de memória (processo Node): ${maxMem.toFixed(2)} MB`)
  console.log(
    `🧮  Total de memória física (RAM): ${(
      os.totalmem() /
      1024 /
      1024 /
      1024
    ).toFixed(2)} GB`,
  )
  console.log(`✅  Build finalizado com código: ${code}\n`)

  process.exit(code)
})
