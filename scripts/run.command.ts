/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

type Workspaces =
  | {
      packages: string[]
    }
  | string[]
type Pkg =
  | {
      name?: string
      scripts?: Record<string, string>
      type?: string
      workspaces?: Workspaces
    }
  | undefined
type FoundPkg = { name?: string; dir: string; pkg?: Pkg }

function readPackageJson(dirPath: string): Pkg {
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

function expandWorkspacePattern(rootDir: string, pattern: string): string[] {
  if (!pattern.includes('*')) return [resolve(rootDir, pattern)]

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

function findPackages(
  rootDir: string,
  workspacePatterns: string[],
  modulesRequested: string[],
  command: string,
): FoundPkg[] {
  const pkgDirs = workspacePatterns.flatMap(pat =>
    expandWorkspacePattern(rootDir, pat),
  )
  const matched: FoundPkg[] = []

  for (const pkgDir of pkgDirs) {
    if (!existsSync(join(pkgDir, 'package.json'))) continue

    const pkg = readPackageJson(pkgDir)
    if (!pkg) continue

    if (modulesRequested.length > 0) {
      const matchesModule = modulesRequested.some(
        m =>
          pkgDir.includes(join('/', m)) ||
          pkgDir.endsWith(m) ||
          (pkg.name && pkg.name.endsWith(m)),
      )
      if (!matchesModule) continue
    }

    if (
      pkg.scripts &&
      Object.prototype.hasOwnProperty.call(pkg.scripts, command)
    ) {
      matched.push({ name: pkg.name, dir: pkgDir, pkg })
    }
  }

  return matched
}

function runInParallel(packages: FoundPkg[], command: string) {
  const proms = packages.map(
    p =>
      new Promise<{ name?: string; code?: number; error?: any }>(
        resolvePromise => {
          const args = ['workspace', p.name || '', 'run', command]

          const env = process.env

          const child = spawn('yarn', args, {
            cwd: p.dir,
            stdio: ['ignore', 'ignore', 'ignore'],
            shell: process.platform === 'win32',
            env,
          })

          const prefix = `[${p.name}] `

          console.log(prefix + `start running command: ${command}`)

          child.on('close', code => {
            resolvePromise({ name: p.name, code: code || 0 })
          })

          child.on('error', err => {
            resolvePromise({ name: p.name, code: 1, error: err })
          })
        },
      ),
  )

  return Promise.all(proms)
}

async function main() {
  if (process.argv.length < 4) {
    console.error(
      'Usage: node scripts/run.command.ts <moduleFolderName...> <scriptName>',
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

  let workspacePatterns: string[] = []
  if (Array.isArray(rootPkg.workspaces)) workspacePatterns = rootPkg.workspaces
  else if (
    rootPkg.workspaces &&
    Array.isArray((rootPkg.workspaces as any).packages)
  )
    workspacePatterns = (rootPkg.workspaces as any).packages
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
