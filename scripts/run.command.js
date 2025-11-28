/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('node:child_process')
const { readFileSync, readdirSync, existsSync } = require('node:fs')
const { resolve, join } = require('node:path')

function readPackageJson(dirPath) {
  try {
    return JSON.parse(
      readFileSync(resolve(dirPath, 'package.json'), {
        encoding: 'utf-8',
        flag: 'r',
      }),
    )
  } catch {
    return
  }
}

function expandWorkspacePattern(rootDir, pattern) {
  // exemplo pattern: "modules/*" -> pega pasta modules e lista subdirs
  if (!pattern.includes('*')) {
    return [resolve(rootDir, pattern)]
  }

  const base = pattern.replace(/\*.*$/, '').replace(/\/$/, '')
  const basePath = resolve(rootDir, base)

  try {
    const entries = readdirSync(basePath, { withFileTypes: true })
    return entries
      .filter(e => e.isDirectory())
      .map(e => resolve(basePath, e.name))
  } catch {
    return []
  }
}

function findPackages(rootDir, workspacePatterns, modulesRequested, command) {
  const pkgDirs = workspacePatterns.flatMap(pat =>
    expandWorkspacePattern(rootDir, pat),
  )

  const matched = []

  for (const pkgDir of pkgDirs) {
    if (!existsSync(join(pkgDir, 'package.json'))) continue

    const pkg = readPackageJson(pkgDir)
    if (!pkg) continue

    if (modulesRequested.length > 0) {
      const matchesModule = modulesRequested.some(
        m =>
          pkgDir.includes(join('/', m)) ||
          pkgDir.endsWith(m) ||
          pkg.name.endsWith(m),
      )
      if (!matchesModule) continue
    }

    if (
      pkg.scripts &&
      Object.prototype.hasOwnProperty.call(pkg.scripts, command)
    ) {
      matched.push({ name: pkg.name, dir: pkgDir })
    }
  }

  return matched
}

function runInParallel(packages, command) {
  const proms = packages.map(
    p =>
      new Promise(resolvePromise => {
        const args = ['workspace', p.name, 'run', command]
        const child = spawn('yarn', args, {
          cwd: p.dir,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
        })

        const prefix = `[${p.name}] `

        child.stdout.on('data', chunk => {
          process.stdout.write(
            prefix + chunk.toString().replace(/\n$/, '\n' + prefix),
          )
        })

        child.stderr.on('data', chunk => {
          process.stderr.write(
            prefix + chunk.toString().replace(/\n$/, '\n' + prefix),
          )
        })

        child.on('close', code => {
          resolvePromise({ name: p.name, code })
        })

        child.on('error', err => {
          // spawn error (ex: yarn não encontrado)
          resolvePromise({ name: p.name, code: 1, error: err })
        })
      }),
  )

  return Promise.all(proms)
}

async function main() {
  if (process.argv.length < 4) {
    console.error(
      'Usage: node scripts/run.command.js <moduleFolderName...> <scriptName>',
    )
    return process.exit(2)
  }

  const args = process.argv.slice(2)
  const modules = args.slice(0, -1)
  const command = args[args.length - 1]

  const rootDir = resolve(__dirname, '..')
  const rootPkg = readPackageJson(rootDir)

  if (!rootPkg || !rootPkg.workspaces) {
    console.error('No workspaces found in root package.json')
    process.exit(2)
  }

  let workspacePatterns = []
  if (Array.isArray(rootPkg.workspaces)) workspacePatterns = rootPkg.workspaces
  else if (rootPkg.workspaces && Array.isArray(rootPkg.workspaces.packages))
    workspacePatterns = rootPkg.workspaces.packages
  else {
    console.error('Unsupported workspaces configuration in root package.json')
    process.exit(2)
  }

  const pkgs = findPackages(rootDir, workspacePatterns, modules, command)

  if (pkgs.length === 0) {
    console.log(
      'No matching packages with the script "%s" found for modules: %s',
      command,
      modules.join(', '),
    )
    return process.exit(0)
  }

  console.log(
    'Found %d package(s): %s',
    pkgs.length,
    pkgs.map(p => p.name).join(', '),
  )
  const results = await runInParallel(pkgs, command)

  let failed = false
  console.log('\nSummary:')
  for (const r of results) {
    if (r.code !== 0) {
      failed = true
      console.log(`  ✖ ${r.name} (exit ${r.code})`)
    } else {
      console.log(`  ✔ ${r.name}`)
    }
  }

  return process.exit(failed ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error', err)
  process.exit(1)
})
