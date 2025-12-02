/* eslint-disable @typescript-eslint/no-require-imports */

const { readdirSync, readFileSync, statSync, rmSync } = require('node:fs')
const { resolve } = require('node:path')

function main() {
  const folder = process.argv[2].trim()
  const folderToAvoidDelete = [
    'src',
    'api',
    'app',
    'public',
    'config',
    'temp',
    'tmp',
  ]

  if (folderToAvoidDelete.includes(folder)) {
    console.error('Invalid folder to remove')
    return process.exit(2)
  }

  const nm = JSON.parse(
    readFileSync(resolve(__dirname, '../package.json'), {
      encoding: 'utf-8',
      flag: 'r',
    }),
  )

  const { packages } = nm.workspaces

  const nms = packages
    .map(pkg => pkg.replace('/*', ''))
    .map(package => resolve(__dirname, '../', package))
    .flatMap(path => {
      try {
        const folders = readdirSync(path, { withFileTypes: true })
        const paths = folders.map(dirent => resolve(path, dirent.name, folder))

        return paths
      } catch {
        return
      }
    })
    .concat(resolve(__dirname, '../', folder))
    .filter(Boolean)
    .map(path => {
      try {
        return {
          path,
          isDirectory: statSync(path).isDirectory(),
        }
      } catch {
        return {
          isDirectory: false,
        }
      }
    })
    .filter(el => el.isDirectory === true)

  nms.forEach(el => rmSync(el.path, { recursive: true }))
}

main()
