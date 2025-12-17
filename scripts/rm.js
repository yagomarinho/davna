/* eslint-disable @typescript-eslint/no-require-imports */

const { readdirSync, readFileSync, statSync, rmSync } = require('node:fs')
const { resolve } = require('node:path')

function readPackageJson(dirPath) {
  try {
    return JSON.parse(
      readFileSync(resolve(dirPath, 'package.json'), {
        encoding: 'utf-8',
        flag: 'r',
      }),
    )
  } catch {
    return undefined
  }
}

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

  // verificar se existe package.json no root do comando e se é mesmo workspace

  const nm = readPackageJson(process.cwd())

  if (!nm || !nm.workspaces) {
    console.error('No workspaces found in root package.json')
    return process.exit(2)
  }

  let packages = []
  if (Array.isArray(nm.workspaces)) packages = nm.workspaces
  else if (nm.workspaces && Array.isArray(nm.workspaces.packages))
    packages = nm.workspaces.packages
  else {
    console.error('Unsupported workspaces configuration in root package.json')
    return process.exit(2)
  }

  const nms = packages
    .map(pkg => pkg.replace('/*', ''))
    .map(package => resolve(process.cwd(), package))
    .flatMap(path => {
      try {
        const folders = readdirSync(path, { withFileTypes: true })
        const paths = folders.map(dirent => resolve(path, dirent.name, folder))

        return paths
      } catch {
        return
      }
    })
    .concat(resolve(process.cwd(), folder))
    .filter(Boolean)
    .map(path => {
      try {
        const isDirectory = statSync(path).isDirectory()

        return {
          path,
          isDirectory,
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
