const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

// Creates, lists and removes this repository's worktrees, outside every
// project tree, at $WORKTREES_ROOT/<repo-name>/<name>
// (docs/process/parallel-features.md, sections 2, 3 and 10). The decisions
// (path resolution, validation and the plan of git commands) are pure
// functions, tested in scripts/__tests__/worktree.spec.js; the command line
// only runs the plan. It never forces anything (no -D, no --force), never
// deletes a branch on origin and never touches .env files: it only lists
// their names.

// the branch types, as the Conventional Commit types
// (docs/process/pull-requests.md)
const TYPES = ['feat', 'fix', 'refactor', 'docs', 'chore']
const BASE_BRANCH = 'main'
const PROJECT_MARKERS = ['.git', 'package.json', 'CLAUDE.md']
const USAGE = [
  'usage: node scripts/worktree.js new <name> [--type feat|fix|refactor|docs|chore] [--base main]',
  '       node scripts/worktree.js list',
  '       node scripts/worktree.js remove <name>',
].join('\n')

const parseArgs = argv => {
  const [command, ...rest] = argv

  if (command === 'list' && rest.length === 0) return { command }
  if (command === 'remove' && rest.length === 1)
    return { command, name: rest[0] }
  if (command !== 'new' || rest.length === 0 || rest[0].startsWith('--'))
    return { error: USAGE }

  const [name, ...options] = rest
  const parsed = { command, name, type: 'feat', base: BASE_BRANCH }

  for (let i = 0; i < options.length; i += 2) {
    const [option, value] = [options[i], options[i + 1]]

    if (option !== '--type' && option !== '--base')
      return { error: `worktree: unknown option ${option}\n${USAGE}` }
    if (value === undefined || value.startsWith('--'))
      return { error: `worktree: ${option} needs a value` }
    parsed[option.slice(2)] = value
  }

  if (!TYPES.includes(parsed.type))
    return {
      error: `worktree: --type must be one of ${TYPES.join(', ')}, not ${parsed.type}`,
    }

  return parsed
}

// the change's slug, as in docs/features/NNN.feature.<name>/
const validateName = name =>
  /^[a-z0-9][a-z0-9.-]*$/.test(name) && !name.includes('..')
    ? null
    : `worktree: the name must be a lowercase slug (letters, digits, hyphens and dots), not "${name}"`

const isInside = (child, parent, p) => {
  const relative = p.relative(p.resolve(parent), p.resolve(child))

  return (
    relative === '' || (!relative.startsWith('..') && !p.isAbsolute(relative))
  )
}

const ancestorsOf = (dir, p) => {
  const ancestors = []

  for (let current = p.resolve(dir); p.dirname(current) !== current;) {
    current = p.dirname(current)
    ancestors.push(current)
  }

  return ancestors
}

const resolveRoot = ({ value, home, path: p }) => {
  const trimmed = (value ?? '').trim()

  if (trimmed === '')
    return {
      error:
        'worktree: WORKTREES_ROOT is not set. Set it once to a folder outside any project tree, e.g. ~/worktrees',
    }

  const expanded = /^~(?=$|[\\/])/.test(trimmed)
    ? p.join(home, trimmed.slice(1))
    : trimmed

  if (!p.isAbsolute(expanded))
    return {
      error: `worktree: WORKTREES_ROOT must be an absolute path, not "${trimmed}"`,
    }

  const normalized = p.normalize(expanded)
  const root =
    normalized.length > 1 && /[\\/]$/.test(normalized)
      ? normalized.slice(0, -1)
      : normalized

  return { root }
}

// null when the root is outside this repository and outside every project
// tree that contains it
const checkRoot = ({ root, repoTop, isProject, path: p }) => {
  const target = p.join(root, p.basename(repoTop))

  if (isInside(root, repoTop, p) || isInside(target, repoTop, p))
    return `worktree: WORKTREES_ROOT (${root}) puts the worktrees inside this repository (${repoTop}); choose a folder outside any project tree`

  for (const ancestor of ancestorsOf(repoTop, p))
    if (isProject(ancestor) && isInside(root, ancestor, p))
      return `worktree: WORKTREES_ROOT (${root}) is inside the project tree ${ancestor}, which contains this repository; choose a folder outside any project tree`

  return null
}

// a linked worktree has its own git dir under the common one
const isMainFolder = (gitDir, commonDir, p) =>
  p.relative(p.resolve(commonDir), p.resolve(gitDir)) === ''

const targetOf = ({ root, repoTop, name, path: p }) =>
  p.join(root, p.basename(repoTop), name)

const planNew = ({
  name,
  type,
  base,
  root,
  repoTop,
  branchExists,
  pathExists,
  path: p,
}) => {
  const invalid = validateName(name)

  if (invalid) return { error: invalid }

  const branch = `${type}/${name}`
  const target = targetOf({ root, repoTop, name, path: p })

  if (pathExists) return { error: `worktree: ${target} already exists` }

  return {
    branch,
    target,
    commands: [
      branchExists
        ? ['worktree', 'add', target, branch]
        : ['worktree', 'add', '-b', branch, target, base],
    ],
  }
}

// git worktree list --porcelain: blocks separated by a blank line
const parseWorktrees = porcelain =>
  porcelain
    .split(/\r?\n\r?\n/)
    .map(block => block.split(/\r?\n/).filter(Boolean))
    .filter(lines => lines.length > 0 && lines[0].startsWith('worktree '))
    .map(lines => {
      const field = key =>
        lines.find(line => line.startsWith(`${key} `))?.slice(key.length + 1)
      const ref = field('branch')

      return {
        path: field('worktree'),
        head: field('HEAD') ?? null,
        branch: ref ? ref.replace(/^refs\/heads\//, '') : null,
      }
    })

const findWorktree = ({ worktrees, target, path: p }) =>
  worktrees.find(
    entry => p.relative(p.resolve(entry.path), p.resolve(target)) === '',
  )

const worktreesUnder = ({ worktrees, dir, path: p }) =>
  worktrees.filter(entry => isInside(entry.path, dir, p))

const planRemove = ({
  name,
  root,
  repoTop,
  worktrees,
  dirty,
  merged,
  path: p,
}) => {
  const invalid = validateName(name)

  if (invalid) return { error: invalid }

  const target = targetOf({ root, repoTop, name, path: p })
  const entry = findWorktree({ worktrees, target, path: p })

  if (entry === undefined)
    return {
      error: `worktree: there is no worktree of this repository at ${target}`,
    }
  if (entry.branch === null)
    return {
      error: `worktree: ${target} has no branch (detached HEAD); remove it by hand`,
    }
  if (dirty)
    return {
      error: `worktree: ${target} has uncommitted changes; commit or discard them first`,
    }
  if (!merged)
    return {
      error: `worktree: ${entry.branch} is not merged into ${BASE_BRANCH}; merge it first (never -D)`,
    }

  return {
    branch: entry.branch,
    target,
    commands: [
      ['worktree', 'remove', target],
      ['branch', '-d', entry.branch],
    ],
    remoteDelete: `git push origin --delete ${entry.branch}`,
  }
}

// the .env files of the main folder that a new worktree does not get; the
// tracked .env.example comes with the checkout
const envFiles = ignored =>
  ignored.filter(file => {
    const name = file.split('/').pop()

    return name.startsWith('.env') && name !== '.env.example'
  })

// what git said on stderr, when it said something
const detailOf = failure => {
  const stderr = String(failure?.stderr ?? '').trim()

  return stderr === '' ? '' : `: ${stderr}`
}

// the exit code of a command line
const run = (argv, deps) => {
  const { git, env, home, exists, isProject, path: p, log, error } = deps
  const parsed = parseArgs(argv)

  if (parsed.error) {
    error(parsed.error)

    return 2
  }

  const read = (args, cwd) => git(args, { cwd }).trim()
  const fail = message => {
    error(message)

    return 1
  }

  let repoTop

  try {
    repoTop = read(['rev-parse', '--show-toplevel'])

    const gitDir = read(['rev-parse', '--path-format=absolute', '--git-dir'])
    const commonDir = read([
      'rev-parse',
      '--path-format=absolute',
      '--git-common-dir',
    ])

    if (!isMainFolder(gitDir, commonDir, p))
      return fail(
        'worktree: run it from the main folder of the repository, not from a worktree',
      )
  } catch {
    return fail('worktree: not inside a git repository')
  }

  const resolved = resolveRoot({ value: env.WORKTREES_ROOT, home, path: p })

  if (resolved.error) return fail(resolved.error)

  const { root } = resolved
  const rootProblem = checkRoot({ root, repoTop, isProject, path: p })

  if (rootProblem) return fail(rootProblem)

  const listWorktrees = () =>
    parseWorktrees(git(['worktree', 'list', '--porcelain'], { cwd: repoTop }))

  if (parsed.command === 'list') {
    const mine = worktreesUnder({
      worktrees: listWorktrees(),
      dir: p.join(root, p.basename(repoTop)),
      path: p,
    })

    if (mine.length === 0) log('worktree: no worktrees of this repository')
    for (const entry of mine)
      log(`${entry.branch ?? '(detached)'}\t${entry.path}`)

    return 0
  }

  if (parsed.command === 'new') {
    const branch = `${parsed.type}/${parsed.name}`
    let branchExists = true

    try {
      git(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], {
        cwd: repoTop,
      })
    } catch {
      branchExists = false
    }

    const plan = planNew({
      ...parsed,
      root,
      repoTop,
      branchExists,
      pathExists: exists(
        targetOf({ root, repoTop, name: parsed.name, path: p }),
      ),
      path: p,
    })

    if (plan.error) return fail(plan.error)

    try {
      for (const command of plan.commands) git(command, { cwd: repoTop })
    } catch (failure) {
      return fail(
        `worktree: git ${plan.commands[0].join(' ')} failed${detailOf(failure)}`,
      )
    }

    const toCopy = envFiles(
      git(
        [
          'ls-files',
          '--others',
          '--ignored',
          '--exclude-standard',
          '--directory',
        ],
        { cwd: repoTop },
      )
        .split(/\r?\n/)
        .filter(Boolean),
    )

    log(`worktree: ${plan.branch} at ${plan.target}`)
    log(`next: cd "${plan.target}" && yarn install`)
    if (toCopy.length > 0) {
      log(
        'the .env files of the main folder are not copied; copy the ones the work needs:',
      )
      for (const file of toCopy) log(`  ${file}`)
    }

    return 0
  }

  // remove
  const worktrees = listWorktrees()
  const target = targetOf({ root, repoTop, name: parsed.name, path: p })
  const entry = findWorktree({ worktrees, target, path: p })
  let dirty = false
  let merged = true

  if (entry !== undefined && entry.branch !== null) {
    try {
      dirty = read(['status', '--porcelain'], entry.path) !== ''
    } catch (failure) {
      return fail(
        `worktree: cannot read the status of ${entry.path}${detailOf(failure)}; if the folder was deleted without git, run git worktree prune`,
      )
    }
    merged = read(
      ['branch', '--merged', BASE_BRANCH, '--format=%(refname:short)'],
      repoTop,
    )
      .split(/\r?\n/)
      .map(line => line.trim())
      .includes(entry.branch)
  }

  const plan = planRemove({
    name: parsed.name,
    root,
    repoTop,
    worktrees,
    dirty,
    merged,
    path: p,
  })

  if (plan.error) return fail(plan.error)

  for (const command of plan.commands)
    try {
      git(command, { cwd: repoTop })
    } catch (failure) {
      return fail(
        `worktree: git ${command.join(' ')} failed; nothing was forced${detailOf(failure)}`,
      )
    }

  log(`worktree: removed ${plan.target} and deleted ${plan.branch}`)
  log(
    `the branch on origin stays; deleting it is a push and needs the user's authorization: ${plan.remoteDelete}`,
  )

  return 0
}

if (require.main === module)
  process.exitCode = run(process.argv.slice(2), {
    git: (args, options) =>
      execFileSync('git', args, {
        ...options,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    env: process.env,
    home: os.homedir(),
    exists: fs.existsSync,
    isProject: dir =>
      PROJECT_MARKERS.some(marker => fs.existsSync(path.join(dir, marker))),
    path,
    log: text => console.log(text),
    error: text => console.error(text),
  })

module.exports = {
  parseArgs,
  validateName,
  resolveRoot,
  isInside,
  ancestorsOf,
  checkRoot,
  isMainFolder,
  planNew,
  parseWorktrees,
  planRemove,
  envFiles,
  run,
}
