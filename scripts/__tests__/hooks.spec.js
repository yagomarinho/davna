const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { posix, win32 } = require('node:path')

const { HOOKS_PATH, shouldEnable, run } = require('../hooks')

const DIR = '/home/dev/code/davna'

describe('shouldEnable', () => {
  it('is true when the package folder is the git toplevel', () => {
    assert.equal(
      shouldEnable({ packageDir: DIR, toplevel: DIR, path: posix }),
      true,
    )
  })

  it('is false when the toplevel is a folder above the package', () => {
    assert.equal(
      shouldEnable({
        packageDir: DIR,
        toplevel: '/home/dev/code',
        path: posix,
      }),
      false,
    )
  })

  it('is false without a toplevel', () => {
    assert.equal(
      shouldEnable({ packageDir: DIR, toplevel: '', path: posix }),
      false,
    )
  })

  it('ignores case and slash direction on Windows', () => {
    assert.equal(
      shouldEnable({
        packageDir: 'D:\\Work\\Davna',
        toplevel: 'd:/work/davna',
        path: win32,
      }),
      true,
    )
  })
})

describe('run', () => {
  const fake = answers => {
    const ran = []
    const lines = []
    const git = (args, options) => {
      ran.push({ args, cwd: options.cwd })
      const answer = answers[args.join(' ')]

      if (answer instanceof Error) throw answer

      return answer ?? ''
    }

    return {
      ran,
      lines,
      deps: {
        git,
        packageDir: DIR,
        path: posix,
        log: text => lines.push(text),
        warn: text => lines.push(text),
      },
    }
  }

  it('points core.hooksPath to .githooks in its own repository', () => {
    const { ran, deps } = fake({ 'rev-parse --show-toplevel': `${DIR}\n` })

    assert.equal(HOOKS_PATH, '.githooks')
    assert.equal(run(deps), 0)
    assert.deepEqual(ran.at(-1), {
      args: ['config', 'core.hooksPath', '.githooks'],
      cwd: DIR,
    })
  })

  it('leaves the configuration of an enclosing repository alone', () => {
    const { ran, lines, deps } = fake({
      'rev-parse --show-toplevel': '/home/dev/code',
    })

    assert.equal(run(deps), 0)
    assert.equal(
      ran.some(call => call.args[0] === 'config'),
      false,
    )
    assert.match(lines.join('\n'), /not the root of its git repository/)
  })

  it('never fails the install when git is missing or there is no repository', () => {
    const { ran, lines, deps } = fake({
      'rev-parse --show-toplevel': new Error('not a git repository'),
    })

    assert.equal(run(deps), 0)
    assert.equal(
      ran.some(call => call.args[0] === 'config'),
      false,
    )
    assert.match(lines.join('\n'), /git hooks not enabled/)
  })

  it('warns and goes on when git config fails', () => {
    const { lines, deps } = fake({
      'rev-parse --show-toplevel': DIR,
      'config core.hooksPath .githooks': new Error('locked'),
    })

    assert.equal(run(deps), 0)
    assert.match(lines.join('\n'), /git hooks not enabled/)
  })
})
