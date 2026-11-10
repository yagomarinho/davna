const { execFileSync } = require('node:child_process')
const path = require('node:path')

// Runs on yarn install (the prepare script): points core.hooksPath to the
// versioned hooks in .githooks, such as the pre-push that refuses a push to
// main, which only changes by merging a pull request
// (docs/process/pull-requests.md).
// It only does so when this folder is the root of its own git repository:
// when the folder sits inside another repository (a copy vendored into
// another project, for example), that repository's configuration is left
// alone. Without git, or outside a repository, there is nothing to enable and
// the install goes on. The decision is pure, tested in
// scripts/__tests__/hooks.spec.js.

const HOOKS_PATH = '.githooks'

const shouldEnable = ({ packageDir, toplevel, path: p }) =>
  Boolean(toplevel) &&
  p.relative(p.resolve(packageDir), p.resolve(toplevel)) === ''

// always 0: a missing hook never fails the install
const run = ({ git, packageDir, path: p, log, warn }) => {
  let toplevel

  try {
    toplevel = git(['rev-parse', '--show-toplevel'], { cwd: packageDir }).trim()
  } catch {
    warn('hooks: git hooks not enabled (git or the repository is unavailable)')

    return 0
  }

  if (!shouldEnable({ packageDir, toplevel, path: p })) {
    log(
      `hooks: ${packageDir} is not the root of its git repository (${toplevel}); core.hooksPath left unchanged`,
    )

    return 0
  }

  try {
    git(['config', 'core.hooksPath', HOOKS_PATH], { cwd: packageDir })
  } catch {
    warn('hooks: git hooks not enabled (git config failed)')
  }

  return 0
}

if (require.main === module)
  process.exitCode = run({
    git: (args, options) =>
      execFileSync('git', args, {
        ...options,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    packageDir: path.resolve(__dirname, '..'),
    path,
    log: text => console.log(text),
    warn: text => console.warn(text),
  })

module.exports = { HOOKS_PATH, shouldEnable, run }
