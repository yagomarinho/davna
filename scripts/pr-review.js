const fs = require('node:fs')

// The review of a pull request into main (docs/process/pull-requests.md).
// "check-body <file|->" validates a PR body filled from
// .github/pull_request_template.md: it runs by hand before the PR is opened
// and in the pr-body job of .github/workflows/checks.yml. "pre-push" runs in
// the pre-push hook, which gets one line per pushed ref on stdin, and refuses
// any push to main or deletion of main: main only changes by merging a pull
// request on GitHub. It only checks that the record exists and is complete;
// the review itself is the work of whoever fills it. The decisions are pure
// functions, tested in scripts/__tests__/pr-review.spec.js; the files and the
// terminal come in as parameters.

// the protected branch and the template's sections
// (docs/process/pull-requests.md)
const PROTECTED_REF = 'refs/heads/main'
const SECTIONS = 7
const ZERO_SHA = /^0+$/
const PROCESS_DOC = 'docs/process/pull-requests.md'
const USAGE = 'usage: node scripts/pr-review.js check-body <file|-> | pre-push'

// what a body may cite as the work it advances: the keywords in any case, a
// register item (RGnn, RAnn) only in capitals, so a word like "rev10" is not
// taken for one
const CITATIONS = [
  /\b(Feature|Refactoring|Improvement) \d{3}\b/i,
  /\bR[A-Z]+\d{2,}\b/,
  /\bfix: \S/i,
  /#\d+\b/,
  /\bProduction picture up to [0-9a-f]{7,40}\b/i,
  /\bProcess: \S/i,
]
const cites = text => CITATIONS.some(citation => citation.test(text))
const MISSING_ADVANCES =
  'missing the **Advances:** line (Feature NNN, stage N; Refactoring NNN; Improvement NNN; an RGnn item; fix: ...; Production picture up to <sha>; Process: <doc>; or Closes #n)'

// a task list item as GitHub renders it: a -, * or + bullet, or numbered
const UNTICKED = /^\s*(?:[-*+]|\d+[.)]) \[ \]/
const TICKED = /^\s*(?:[-*+]|\d+[.)]) \[x\]/i

// the user's waiver, in full (docs/process/gates.md, section 3)
const WAIVER = /\*\*Waived\*\* on \d{4}-\d{2}-\d{2} by the user: \S/

// HTML comments and fenced code blocks are guidance or quotes, never items
const withoutComments = text =>
  text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^ {0,3}(```|~~~)[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gm, '')

// the cited work, with the template's <placeholders> taken out
const advancesOf = lines => {
  const found = lines.find(text => text.includes('**Advances:**'))

  if (found === undefined) return ''

  return found
    .slice(found.indexOf('**Advances:**') + '**Advances:**'.length)
    .replace(/<[^>]*>/g, '')
    .trim()
}

// the non-blank lines under each "## n. " heading, up to the next heading
const sectionsOf = lines => {
  const sections = new Map()
  let current = null

  for (const text of lines) {
    const heading = /^## (\d+)\. /.exec(text)

    if (heading) {
      current = Number(heading[1])
      sections.set(current, [])
    } else if (/^#{1,2} /.test(text)) current = null
    else if (current !== null && text.trim() !== '')
      sections.get(current).push(text)
  }

  return sections
}

// what a body lacks; an empty list when it is complete
const problemsOf = body => {
  const problems = []
  const lines = withoutComments(body).split(/\r?\n/)

  if (!cites(advancesOf(lines))) problems.push(MISSING_ADVANCES)

  const sections = sectionsOf(lines)

  for (let n = 1; n <= SECTIONS; n++)
    if (!sections.has(n)) problems.push(`missing section ${n}`)
    else if (sections.get(n).length === 0)
      problems.push(`section ${n} is empty`)

  // a ticked item carries its result after the em dash; an unticked one only
  // passes when the user waived it
  for (const text of lines)
    if (UNTICKED.test(text) && !WAIVER.test(text))
      problems.push(`item without an answer: ${text.trim()}`)
    else if (TICKED.test(text) && !/ — \S/.test(text))
      problems.push(`ticked item without its result: ${text.trim()}`)

  return problems
}

// each stdin line: <local ref> <local sha> <remote ref> <remote sha>; a push
// to main and the deletion of main are both refused
const refusedRefs = input =>
  input
    .split(/\r?\n/)
    .filter(Boolean)
    .map(text => text.split(' '))
    .filter(([, , remoteRef]) => remoteRef === PROTECTED_REF)
    .map(([, localSha, remoteRef]) => ({
      remoteRef,
      deletion: ZERO_SHA.test(localSha),
    }))

const report = (where, problems, { error }) => {
  if (problems.length === 0) return true

  error(`pr-review: ${where}`)
  for (const problem of problems) error(`  - ${problem}`)
  error(`  see ${PROCESS_DOC}`)

  return false
}

const prePush = (input, deps) =>
  report(
    'push refused: main only changes by merging a pull request',
    refusedRefs(input).map(({ deletion }) =>
      deletion
        ? 'deleting main is never allowed'
        : 'push a branch (docs/, feat/, fix/, refactor/ or chore/) and open a pull request instead',
    ),
    deps,
  )

const checkBody = (body, deps) => {
  const ok = report(
    'the pull request body is incomplete',
    problemsOf(body),
    deps,
  )

  if (ok) deps.log('pr-review: ok')

  return ok
}

// the exit code of a command line
const run = (argv, deps) => {
  const [command, file] = argv

  if (command === 'pre-push') return prePush(deps.readStdin(), deps) ? 0 : 1
  if (command === 'check-body' && file !== undefined) {
    const body = file === '-' ? deps.readStdin() : deps.readFile(file)

    return checkBody(body, deps) ? 0 : 1
  }

  deps.error(USAGE)

  return 2
}

if (require.main === module)
  process.exitCode = run(process.argv.slice(2), {
    readFile: file => fs.readFileSync(file, 'utf8'),
    readStdin: () => fs.readFileSync(0, 'utf8'),
    log: text => console.log(text),
    error: text => console.error(text),
  })

module.exports = {
  PROTECTED_REF,
  SECTIONS,
  PROCESS_DOC,
  problemsOf,
  withoutComments,
  refusedRefs,
  prePush,
  checkBody,
  run,
}
