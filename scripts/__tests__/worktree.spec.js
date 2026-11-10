const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const {
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
} = require('../worktree')

const { posix, win32 } = path

const REPO = '/home/dev/code/davna'
const ROOT = '/home/dev/worktrees'

// only the repository itself is a project tree, unless a test says otherwise
const onlyRepo = dir => dir === REPO

describe('parseArgs', () => {
  it('reads new with the default type and base', () => {
    assert.deepEqual(parseArgs(['new', 'conductor-contract']), {
      command: 'new',
      name: 'conductor-contract',
      type: 'feat',
      base: 'main',
    })
  })

  it('reads --type and --base', () => {
    assert.deepEqual(
      parseArgs(['new', 'core-tests', '--type', 'refactor', '--base', 'dev']),
      { command: 'new', name: 'core-tests', type: 'refactor', base: 'dev' },
    )
  })

  it('reads every Conventional Commit branch type', () => {
    for (const type of ['feat', 'fix', 'refactor', 'docs', 'chore'])
      assert.equal(parseArgs(['new', 'x', '--type', type]).type, type)
  })

  it('refuses a type other than feat, fix, refactor, docs or chore', () => {
    assert.match(
      parseArgs(['new', 'x', '--type', 'claude']).error,
      /--type must be one of feat, fix, refactor, docs, chore, not claude/,
    )
  })

  it('refuses an option without its value', () => {
    assert.match(
      parseArgs(['new', 'x', '--base']).error,
      /--base needs a value/,
    )
  })

  it('refuses an unknown option', () => {
    assert.match(parseArgs(['new', 'x', '--force']).error, /unknown option/)
  })

  it('reads list and remove', () => {
    assert.deepEqual(parseArgs(['list']), { command: 'list' })
    assert.deepEqual(parseArgs(['remove', 'x']), {
      command: 'remove',
      name: 'x',
    })
  })

  it('needs a name for new and remove', () => {
    assert.match(parseArgs(['new']).error, /usage/)
    assert.match(parseArgs(['remove']).error, /usage/)
  })

  it('refuses an unknown command', () => {
    assert.match(parseArgs(['prune']).error, /usage/)
    assert.match(parseArgs([]).error, /usage/)
  })
})

describe('validateName', () => {
  it('accepts a slug with hyphens and dots', () => {
    assert.equal(validateName('conductor-contract'), null)
    assert.equal(validateName('v2.http'), null)
  })

  it('refuses slashes, spaces, uppercase and a leading dot or hyphen', () => {
    for (const name of ['feat/x', 'a b', 'Name', '.x', '-x', '..', ''])
      assert.match(validateName(name), /lowercase slug/, name)
  })
})

describe('isInside', () => {
  it('is true for the folder itself and its descendants', () => {
    assert.equal(isInside(REPO, REPO, posix), true)
    assert.equal(isInside(`${REPO}/apps/x`, REPO, posix), true)
  })

  it('is false for a sibling with the same prefix', () => {
    assert.equal(isInside('/home/dev/code/davna2', REPO, posix), false)
    assert.equal(isInside('/home/dev', REPO, posix), false)
  })

  it('ignores case and slash direction on Windows', () => {
    assert.equal(isInside('d:\\Work\\Repo\\x', 'D:/work/repo', win32), true)
  })
})

describe('ancestorsOf', () => {
  it('lists every folder above, nearest first', () => {
    assert.deepEqual(ancestorsOf('/a/b/c', posix), ['/a/b', '/a', '/'])
  })
})

describe('resolveRoot', () => {
  it('fails when WORKTREES_ROOT is not set or is empty', () => {
    for (const value of [undefined, '', '   '])
      assert.match(
        resolveRoot({ value, home: '/home/dev', path: posix }).error,
        /WORKTREES_ROOT is not set/,
      )
  })

  it('expands a leading ~ to the home folder', () => {
    assert.deepEqual(
      resolveRoot({ value: '~/worktrees', home: '/home/dev', path: posix }),
      { root: ROOT },
    )
  })

  it('normalizes an absolute path', () => {
    assert.deepEqual(
      resolveRoot({ value: '/home/dev//worktrees/', path: posix }),
      { root: ROOT },
    )
  })

  it('refuses a relative path', () => {
    assert.match(
      resolveRoot({ value: 'worktrees', home: '/home/dev', path: posix }).error,
      /must be an absolute path/,
    )
  })
})

describe('checkRoot', () => {
  it('accepts a root outside every project tree', () => {
    assert.equal(
      checkRoot({
        root: ROOT,
        repoTop: REPO,
        isProject: onlyRepo,
        path: posix,
      }),
      null,
    )
  })

  it('refuses the repository itself or a folder inside it', () => {
    for (const root of [REPO, `${REPO}/.worktrees`])
      assert.match(
        checkRoot({ root, repoTop: REPO, isProject: onlyRepo, path: posix }),
        /inside this repository/,
      )
  })

  it('refuses a root inside a project tree that contains the repository', () => {
    const outer = '/home/dev/code'
    const isProject = dir => dir === REPO || dir === outer

    assert.match(
      checkRoot({
        root: `${outer}/.worktrees`,
        repoTop: REPO,
        isProject,
        path: posix,
      }),
      /inside the project tree \/home\/dev\/code/,
    )
  })

  it('accepts a root inside a plain folder that contains the repository', () => {
    assert.equal(
      checkRoot({
        root: '/home/dev/code/.worktrees',
        repoTop: REPO,
        isProject: onlyRepo,
        path: posix,
      }),
      null,
    )
  })

  it('refuses a root whose worktree folder would land inside the repository', () => {
    assert.match(
      checkRoot({
        root: '/home/dev/code',
        repoTop: REPO,
        isProject: onlyRepo,
        path: posix,
      }),
      /inside this repository/,
    )
  })
})

describe('isMainFolder', () => {
  it('is true when the git dir is the common dir', () => {
    assert.equal(isMainFolder('/r/.git', '/r/.git', posix), true)
  })

  it('is false inside a linked worktree', () => {
    assert.equal(isMainFolder('/r/.git/worktrees/x', '/r/.git', posix), false)
  })
})

describe('planNew', () => {
  const base = {
    name: 'conductor-contract',
    type: 'feat',
    base: 'main',
    root: ROOT,
    repoTop: REPO,
    branchExists: false,
    pathExists: false,
    path: posix,
  }

  it('creates the branch from the base and its worktree under root/<repo>', () => {
    assert.deepEqual(planNew(base), {
      branch: 'feat/conductor-contract',
      target: `${ROOT}/davna/conductor-contract`,
      commands: [
        [
          'worktree',
          'add',
          '-b',
          'feat/conductor-contract',
          `${ROOT}/davna/conductor-contract`,
          'main',
        ],
      ],
    })
  })

  it('only adds the worktree for an existing branch', () => {
    assert.deepEqual(
      planNew({ ...base, type: 'refactor', branchExists: true }).commands,
      [
        [
          'worktree',
          'add',
          `${ROOT}/davna/conductor-contract`,
          'refactor/conductor-contract',
        ],
      ],
    )
  })

  it('refuses when the folder already exists', () => {
    assert.match(planNew({ ...base, pathExists: true }).error, /already exists/)
  })

  it('refuses an invalid name', () => {
    assert.match(planNew({ ...base, name: 'feat/x' }).error, /lowercase slug/)
  })
})

describe('parseWorktrees', () => {
  it('reads the porcelain list, detached heads included', () => {
    const porcelain = [
      `worktree ${REPO}`,
      'HEAD e210e4b1077022085002c1911f672512a734aeab',
      'branch refs/heads/main',
      '',
      `worktree ${ROOT}/davna/x`,
      'HEAD 1111111111111111111111111111111111111111',
      'branch refs/heads/feat/x',
      '',
      `worktree ${ROOT}/davna/y`,
      'HEAD 2222222222222222222222222222222222222222',
      'detached',
      '',
    ].join('\n')

    assert.deepEqual(parseWorktrees(porcelain), [
      {
        path: REPO,
        head: 'e210e4b1077022085002c1911f672512a734aeab',
        branch: 'main',
      },
      {
        path: `${ROOT}/davna/x`,
        head: '1111111111111111111111111111111111111111',
        branch: 'feat/x',
      },
      {
        path: `${ROOT}/davna/y`,
        head: '2222222222222222222222222222222222222222',
        branch: null,
      },
    ])
  })
})

describe('planRemove', () => {
  const worktrees = [
    { path: REPO, head: 'a', branch: 'main' },
    { path: `${ROOT}/davna/x`, head: 'b', branch: 'feat/x' },
  ]
  const base = {
    name: 'x',
    root: ROOT,
    repoTop: REPO,
    worktrees,
    dirty: false,
    merged: true,
    path: posix,
  }

  it('removes the worktree, deletes the branch with -d and prints the remote command', () => {
    assert.deepEqual(planRemove(base), {
      branch: 'feat/x',
      target: `${ROOT}/davna/x`,
      commands: [
        ['worktree', 'remove', `${ROOT}/davna/x`],
        ['branch', '-d', 'feat/x'],
      ],
      remoteDelete: 'git push origin --delete feat/x',
    })
  })

  it('never forces: no -D and no --force anywhere in the plan', () => {
    const flat = planRemove(base).commands.flat()

    assert.equal(flat.includes('-D'), false)
    assert.equal(flat.includes('--force'), false)
    assert.equal(flat.includes('-f'), false)
  })

  it('refuses a worktree with uncommitted changes', () => {
    assert.match(planRemove({ ...base, dirty: true }).error, /uncommitted/)
  })

  it('refuses a branch that is not merged', () => {
    assert.match(planRemove({ ...base, merged: false }).error, /not merged/)
  })

  it('refuses a name with no worktree of this repository', () => {
    assert.match(planRemove({ ...base, name: 'y' }).error, /no worktree/)
  })

  it('refuses a detached worktree', () => {
    const detached = [{ path: `${ROOT}/davna/x`, head: 'b', branch: null }]

    assert.match(
      planRemove({ ...base, worktrees: detached }).error,
      /has no branch/,
    )
  })
})

describe('envFiles', () => {
  it('keeps only the .env files, never the example', () => {
    assert.deepEqual(
      envFiles([
        '.env',
        '.env.dev',
        '.env.example',
        'apps/client.app/.env',
        'apps/client.app/.env.example',
        'node_modules/',
        'coverage/',
        'apps/client.app/.next/',
        'docs/environment.md',
      ]),
      ['.env', '.env.dev', 'apps/client.app/.env'],
    )
  })
})

describe('run', () => {
  // a fake environment: git answers from a table and records what it runs
  const fake = ({ answers = {}, env = { WORKTREES_ROOT: ROOT } } = {}) => {
    const ran = []
    const lines = []
    const git = (args, options = {}) => {
      const key = args.join(' ')

      ran.push({ args, cwd: options.cwd })
      if (key in answers) {
        const answer = answers[key]

        if (answer instanceof Error) throw answer

        return answer
      }

      return ''
    }

    return {
      ran,
      lines,
      deps: {
        git,
        env,
        home: '/home/dev',
        exists: () => false,
        isProject: onlyRepo,
        path: posix,
        log: text => lines.push(text),
        error: text => lines.push(text),
      },
    }
  }

  const repoAnswers = {
    'rev-parse --show-toplevel': REPO,
    'rev-parse --path-format=absolute --git-dir': `${REPO}/.git`,
    'rev-parse --path-format=absolute --git-common-dir': `${REPO}/.git`,
  }

  it('runs the plan of new and lists the .env files to copy', () => {
    const { ran, lines, deps } = fake({
      answers: {
        ...repoAnswers,
        'show-ref --verify --quiet refs/heads/feat/x': new Error('missing'),
        'ls-files --others --ignored --exclude-standard --directory':
          '.env.dev\nnode_modules/\n',
      },
    })

    assert.equal(run(['new', 'x'], deps), 0)
    assert.deepEqual(ran.find(call => call.args[0] === 'worktree').args, [
      'worktree',
      'add',
      '-b',
      'feat/x',
      `${ROOT}/davna/x`,
      'main',
    ])
    assert.match(lines.join('\n'), /\.env\.dev/)
  })

  it('fails before any change when WORKTREES_ROOT is unset', () => {
    const { ran, lines, deps } = fake({ answers: repoAnswers, env: {} })

    assert.equal(run(['new', 'x'], deps), 1)
    assert.equal(
      ran.some(call => call.args[0] === 'worktree'),
      false,
    )
    assert.match(lines.join('\n'), /WORKTREES_ROOT is not set/)
  })

  it('refuses to run from a linked worktree', () => {
    const { ran, lines, deps } = fake({
      answers: {
        ...repoAnswers,
        'rev-parse --path-format=absolute --git-dir': `${REPO}/.git/worktrees/x`,
      },
    })

    assert.equal(run(['new', 'y'], deps), 1)
    assert.equal(
      ran.some(call => call.args[0] === 'worktree'),
      false,
    )
    assert.match(lines.join('\n'), /main folder/)
  })

  it('removes a merged, clean worktree and prints the remote command', () => {
    const { ran, lines, deps } = fake({
      answers: {
        ...repoAnswers,
        'worktree list --porcelain': [
          `worktree ${REPO}`,
          'HEAD a',
          'branch refs/heads/main',
          '',
          `worktree ${ROOT}/davna/x`,
          'HEAD b',
          'branch refs/heads/feat/x',
          '',
        ].join('\n'),
        'status --porcelain': '',
        'branch --merged main --format=%(refname:short)': 'main\nfeat/x\n',
      },
    })

    assert.equal(run(['remove', 'x'], deps), 0)
    assert.deepEqual(
      ran
        .filter(call => ['worktree', 'branch'].includes(call.args[0]))
        .map(call => call.args)
        .filter(args => args[1] !== 'list' && args[1] !== '--merged'),
      [
        ['worktree', 'remove', `${ROOT}/davna/x`],
        ['branch', '-d', 'feat/x'],
      ],
    )
    assert.match(lines.join('\n'), /git push origin --delete feat\/x/)
  })

  it('refuses to remove a dirty worktree and runs nothing', () => {
    const { ran, deps } = fake({
      answers: {
        ...repoAnswers,
        'worktree list --porcelain': `worktree ${ROOT}/davna/x\nHEAD b\nbranch refs/heads/feat/x\n`,
        'status --porcelain': ' M src/index.ts\n',
        'branch --merged main --format=%(refname:short)': 'feat/x\n',
      },
    })

    assert.equal(run(['remove', 'x'], deps), 1)
    assert.equal(
      ran.some(call => call.args[1] === 'remove' || call.args[1] === '-d'),
      false,
    )
  })

  it('lists only the worktrees of this repository', () => {
    const { lines, deps } = fake({
      answers: {
        ...repoAnswers,
        'worktree list --porcelain': [
          `worktree ${REPO}`,
          'HEAD a',
          'branch refs/heads/main',
          '',
          `worktree ${ROOT}/davna/x`,
          'HEAD b',
          'branch refs/heads/feat/x',
          '',
          `worktree ${ROOT}/other/z`,
          'HEAD c',
          'branch refs/heads/feat/z',
          '',
        ].join('\n'),
      },
    })

    assert.equal(run(['list'], deps), 0)
    assert.match(lines.join('\n'), /feat\/x/)
    assert.doesNotMatch(lines.join('\n'), /feat\/z/)
  })

  it('prints the usage and exits with 2 for bad arguments', () => {
    const { deps } = fake()

    assert.equal(run(['prune'], deps), 2)
  })
})
