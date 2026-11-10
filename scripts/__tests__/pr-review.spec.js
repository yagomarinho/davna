const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  PROTECTED_REF,
  SECTIONS,
  PROCESS_DOC,
  problemsOf,
  withoutComments,
  refusedRefs,
  prePush,
  checkBody,
  run,
} = require('../pr-review')

const TIP = 'ffeeddccbbaa99887766554433221100ffeeddcc'
const BASE = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const ZERO = '0000000000000000000000000000000000000000'

const TEMPLATE = path.join(
  __dirname,
  '..',
  '..',
  '.github',
  'pull_request_template.md',
)

// a body with what it advances, every section and every item answered
const complete = (advances = 'Feature 001, stage 3') =>
  [
    'Adds the conductor contract.',
    '',
    `- **Advances:** ${advances}`,
    '',
    ...Array.from({ length: SECTIONS }, (_, i) => [
      `## ${i + 1}. Section ${i + 1}`,
      '',
      `- [x] item ${i + 1} — checked with \`yarn typecheck\`, green`,
      '',
    ]).flat(),
  ].join('\n')

// one pre-push stdin line: <local ref> <local sha> <remote ref> <remote sha>
const line = (localSha, remoteRef = PROTECTED_REF, remoteSha = BASE) =>
  `refs/heads/x ${localSha} ${remoteRef} ${remoteSha}`

const silent = () => {
  const lines = []

  return {
    lines,
    error: text => lines.push(text),
    log: text => lines.push(text),
  }
}

// fills the template as an author would: what it advances, and a result on
// every item
const fill = template =>
  template
    .split('\n')
    .map(text =>
      text.includes('**Advances:**')
        ? '- **Advances:** Refactoring 002, stage 4'
        : text.replace(/^(\s*)- \[ \] (.*)$/, '$1- [x] $2 — checked, green'),
    )
    .join('\n')

describe('the constants', () => {
  it('protects main, with seven sections, pointing to the process', () => {
    assert.equal(PROTECTED_REF, 'refs/heads/main')
    assert.equal(SECTIONS, 7)
    assert.equal(PROCESS_DOC, 'docs/process/pull-requests.md')
  })
})

describe('problemsOf', () => {
  it('accepts a complete body', () => {
    assert.deepEqual(problemsOf(complete()), [])
  })

  it('reads a body with CRLF line endings', () => {
    assert.deepEqual(problemsOf(complete().replace(/\n/g, '\r\n')), [])
  })

  it('names each missing section', () => {
    const text = complete().replace('## 3. ', '## Three. ')

    assert.deepEqual(problemsOf(text), ['missing section 3'])
  })

  it('refuses an empty section', () => {
    const text = complete().replace(/- \[x\] item 5 .*\n/, '')

    assert.deepEqual(problemsOf(text), ['section 5 is empty'])
  })

  it('takes a section with only an HTML comment as empty', () => {
    const text = complete().replace(
      /- \[x\] item 2 .*\n/,
      '<!-- write the checks here -->\n',
    )

    assert.deepEqual(problemsOf(text), ['section 2 is empty'])
  })

  it('accepts a section answered in prose, as a docs-only PR does', () => {
    const text = complete().replace(
      /- \[x\] item 3 .*\n/,
      'Does not apply: docs-only pull request.\n',
    )

    assert.deepEqual(problemsOf(text), [])
  })

  it('refuses an unticked item that is not waived', () => {
    const text = `${complete()}\n- [ ] DNS and certificates\n`

    assert.deepEqual(problemsOf(text), [
      'item without an answer: - [ ] DNS and certificates',
    ])
  })

  it('accepts an unticked item waived by the user', () => {
    const text = `${complete()}\n- [ ] DNS — **Waived** on 2026-11-12 by the user: none\n`

    assert.deepEqual(problemsOf(text), [])
  })

  it('refuses a ticked item without its result after the em dash', () => {
    const text = `${complete()}\n- [x] the server: disk and memory\n`

    assert.deepEqual(problemsOf(text), [
      'ticked item without its result: - [x] the server: disk and memory',
    ])
  })

  it('accepts an uppercase X with its result', () => {
    const text = `${complete()}\n- [X] the registry — push permission checked\n`

    assert.deepEqual(problemsOf(text), [])
  })

  it('ignores items inside HTML comments', () => {
    const text = `${complete()}\n<!--\n- [ ] an example item\n-->\n`

    assert.deepEqual(problemsOf(text), [])
  })

  it('refuses a body that does not say what it advances', () => {
    const text = complete().replace(/- \*\*Advances:\*\*.*\n/, '')

    assert.deepEqual(problemsOf(text), [
      'missing the **Advances:** line (Feature NNN, stage N; Refactoring NNN; Improvement NNN; an RGnn item; fix: ...; Production picture up to <sha>; Process: <doc>; or Closes #n)',
    ])
  })

  it('refuses an Advances line left as the placeholder', () => {
    const text = complete('<Feature NNN, stage N | RGnn | fix: what>')

    assert.equal(problemsOf(text).length, 1)
    assert.match(problemsOf(text)[0], /missing the \*\*Advances:\*\* line/)
  })

  it('accepts every kind of citation', () => {
    for (const advances of [
      'Feature 004, stage 3',
      'Refactoring 001',
      'Improvement 002',
      'RG10',
      'RA03 of Feature 001',
      'fix: the refresh token expiry',
      'Closes #12',
    ])
      assert.deepEqual(problemsOf(complete(advances)), [], advances)
  })

  it('refuses an Advances line that cites nothing known', () => {
    assert.equal(problemsOf(complete('some work')).length, 1)
  })

  it('accepts the citations of PRs that advance no feature', () => {
    for (const advances of [
      'Production picture up to 1a2b3c4',
      'Process: docs/process/gates.md',
      'Process: docs/patterns/ci-triggers.md',
    ])
      assert.deepEqual(problemsOf(complete(advances)), [], advances)
  })

  it('refuses those citations left incomplete', () => {
    for (const advances of ['Production picture up to', 'Process:'])
      assert.equal(problemsOf(complete(advances)).length, 1, advances)
  })

  it('refuses an unanswered item of every task list marker', () => {
    for (const item of [
      '* [ ] never',
      '+ [ ] never',
      '1. [ ] never',
      '12) [ ] never',
    ])
      assert.deepEqual(problemsOf(`${complete()}\n${item}\n`), [
        `item without an answer: ${item}`,
      ])
  })

  it('refuses a ticked item of every marker without its result', () => {
    for (const item of ['* [x] no result', '+ [X] no result', '2. [x] none'])
      assert.deepEqual(problemsOf(`${complete()}\n${item}\n`), [
        `ticked item without its result: ${item}`,
      ])
  })

  it('accepts answered items of every task list marker', () => {
    const text = [
      complete(),
      '* [x] the registry — checked',
      '1. [ ] DNS — **Waived** on 2026-11-12 by the user: no domain change',
      '',
    ].join('\n')

    assert.deepEqual(problemsOf(text), [])
  })

  it('keeps the register form case-sensitive', () => {
    for (const advances of ['rev10 cleanup', 'rg01', 'Rg01'])
      assert.equal(problemsOf(complete(advances)).length, 1, advances)
  })

  it('keeps the keywords case-insensitive', () => {
    for (const advances of ['feature 004, stage 3', 'Fix: the refresh', 'process: docs/process/gates.md'])
      assert.deepEqual(problemsOf(complete(advances)), [], advances)
  })

  it('ignores items quoted inside fenced code blocks', () => {
    const text = `${complete()}\n\`\`\`md\n- [ ] DNS and certificates\n- [x] no result\n\`\`\`\n`

    assert.deepEqual(problemsOf(text), [])
  })

  it('still judges the items after a fenced code block', () => {
    const text = `${complete()}\n\`\`\`\nquoted\n\`\`\`\n- [ ] never answered\n`

    assert.deepEqual(problemsOf(text), [
      'item without an answer: - [ ] never answered',
    ])
  })

  it('refuses a waiver without its date, the user and the reason', () => {
    for (const item of [
      '- [ ] x **Waived**',
      '- [ ] x — **Waived** by the user: none',
      '- [ ] x — **Waived** on 2026-11-12 by the user:',
      '- [ ] x — **Waived** on 12/11/2026 by the user: none',
    ])
      assert.deepEqual(problemsOf(`${complete()}\n${item}\n`), [
        `item without an answer: ${item}`,
      ])
  })
})

describe('the pull request template', () => {
  const template = fs.readFileSync(TEMPLATE, 'utf8')

  it('fails the check while it is not filled', () => {
    assert.notDeepEqual(problemsOf(template), [])
  })

  it('cites nothing while its Advances placeholder is not filled', () => {
    assert.match(problemsOf(template)[0], /missing the \*\*Advances:\*\* line/)
  })

  it('has the seven sections in order', () => {
    const numbers = [...template.matchAll(/^## (\d+)\. /gm)].map(m => +m[1])

    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7])
  })

  it('passes the check once filled', () => {
    assert.deepEqual(problemsOf(fill(template)), [])
  })

  // the em dash separates an item from its result: an item worded with one
  // would pass as answered without a result
  it('words no item with the em dash that separates the result', () => {
    const items = withoutComments(template)
      .split('\n')
      .filter(text => /^\s*(?:[-*+]|\d+[.)]) \[[ x]\]/i.test(text))

    assert.ok(items.length > 0)
    for (const item of items) assert.doesNotMatch(item, / — /, item)
  })
})

describe('refusedRefs', () => {
  it('refuses a push to main', () => {
    assert.deepEqual(refusedRefs(line(TIP)), [
      { remoteRef: PROTECTED_REF, deletion: false },
    ])
  })

  it('refuses the deletion of main', () => {
    assert.deepEqual(refusedRefs(line(ZERO)), [
      { remoteRef: PROTECTED_REF, deletion: true },
    ])
  })

  it('lets every other branch through, even its deletion', () => {
    const input = [
      line(TIP, 'refs/heads/feat/conductor-contract'),
      line(ZERO, 'refs/heads/docs/accept-stage-3'),
      line(TIP, 'refs/heads/main-notes'),
      '',
    ].join('\n')

    assert.deepEqual(refusedRefs(input), [])
  })

  it('reads CRLF input', () => {
    assert.equal(refusedRefs(`${line(TIP)}\r\n`).length, 1)
  })

  it('lets an empty push through', () => {
    assert.deepEqual(refusedRefs(''), [])
  })
})

describe('prePush', () => {
  it('lets a branch push through silently', () => {
    const out = silent()

    assert.equal(prePush(line(TIP, 'refs/heads/feat/x'), out), true)
    assert.deepEqual(out.lines, [])
  })

  it('refuses a push to main, saying main changes by pull request', () => {
    const out = silent()

    assert.equal(prePush(line(TIP), out), false)
    assert.match(
      out.lines.join('\n'),
      /main only changes by merging a pull request/,
    )
    assert.match(out.lines.join('\n'), /docs\/process\/pull-requests\.md/)
  })

  it('refuses the deletion of main', () => {
    const out = silent()

    assert.equal(prePush(line(ZERO), out), false)
    assert.match(out.lines.join('\n'), /deleting main/)
  })
})

describe('checkBody', () => {
  it('says ok for a complete body', () => {
    const out = silent()

    assert.equal(checkBody(complete(), out), true)
    assert.deepEqual(out.lines, ['pr-review: ok'])
  })

  it('lists the problems of an incomplete body', () => {
    const out = silent()

    assert.equal(
      checkBody(complete().replace('## 7. ', '## Seven. '), out),
      false,
    )
    assert.match(out.lines.join('\n'), /missing section 7/)
    assert.match(out.lines.join('\n'), /docs\/process\/pull-requests\.md/)
  })
})

describe('run', () => {
  it('prints the usage and exits with 2 for an unknown command', () => {
    const out = silent()

    assert.equal(run(['nope'], out), 2)
    assert.match(out.lines.join('\n'), /usage: node scripts\/pr-review\.js/)
  })

  it('needs a file for check-body', () => {
    assert.equal(run(['check-body'], silent()), 2)
  })

  it('reads the body from a file', () => {
    const read = []
    const deps = {
      ...silent(),
      readFile: file => (read.push(file), complete()),
    }

    assert.equal(run(['check-body', 'body.md'], deps), 0)
    assert.deepEqual(read, ['body.md'])
  })

  it('reads the body from stdin with -', () => {
    const deps = { ...silent(), readStdin: () => complete() }

    assert.equal(run(['check-body', '-'], deps), 0)
  })

  it('exits with 1 for an incomplete body', () => {
    const deps = { ...silent(), readFile: () => 'nothing' }

    assert.equal(run(['check-body', 'body.md'], deps), 1)
  })

  it('exits with 1 when pre-push refuses and 0 otherwise', () => {
    assert.equal(
      run(['pre-push'], { ...silent(), readStdin: () => line(TIP) }),
      1,
    )
    assert.equal(
      run(['pre-push'], {
        ...silent(),
        readStdin: () => line(TIP, 'refs/heads/fix/x'),
      }),
      0,
    )
  })
})
