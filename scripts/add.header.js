const {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} = require('node:fs')

const { resolve, join, extname } = require('node:path')

const ROOT = process.cwd()

const HEADER =
  readFileSync(join(ROOT, 'docs', 'license.header.txt'), 'utf8').trim() + '\n\n'

const EXTENSIONS = ['.ts']
const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.scripts',
  '.next',
  'docs',
])

const IGNORE_FILE_PATTERN = /\.spec\.ts/

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

function hasLicense(content) {
  return content.includes(HEADER)
}

function findPackagesSrcFolder(packages) {
  const folders = packages
    .map(pkg => pkg.replace('/*', ''))
    .flatMap(path => {
      try {
        const folders = readdirSync(path, { withFileTypes: true })
        const paths = folders.map(dirent => resolve(path, dirent.name, 'src'))

        return paths
      } catch {
        return
      }
    })
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

  return folders
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        walk(join(dir, entry.name))
      }
      continue
    }

    if (IGNORE_FILE_PATTERN.test(entry.name)) continue

    const ext = extname(entry.name)
    if (!EXTENSIONS.includes(ext)) continue

    const filePath = join(dir, entry.name)
    const content = readFileSync(filePath, 'utf8')

    if (hasLicense(content)) {
      console.log(join(dir, entry.name))
      continue
    }

    writeFileSync(filePath, HEADER + content)
    console.log(`✔ License added: ${filePath}`)
  }
}

function main() {
  // Ler o package.json
  const nm = readPackageJson(ROOT)

  // Pegar o seu workspace
  if (!nm || !nm.workspaces) {
    console.error('No workspaces found in root package.json')
    return process.exit(2)
  }

  // Ler os seus packages
  let packages = []
  if (Array.isArray(nm.workspaces)) packages = nm.workspaces
  else if (nm.workspaces && Array.isArray(nm.workspaces.packages))
    packages = nm.workspaces.packages
  else {
    console.error('Unsupported workspaces configuration in root package.json')
    return process.exit(2)
  }

  // verificar dentro de cada package para saber se tem src e dentro de src começar o walk
  const srcs = findPackagesSrcFolder(packages)

  // pelas outras pastas até achar os arquivos com terminações .ts (não quero .tsx por enquanto)

  srcs.forEach(src => walk(src.path))
}

main()
