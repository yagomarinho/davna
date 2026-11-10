# Stages 8 and 9: tests and implementation

## Stage 8: the test checklist

`8.tests.checklist.md` lists every test, for the user to approve before any test code is written (`docs/process/feature-stages.md`, section 4).

1. **Read the current test pattern first:** the `@davna/jest` package (`config/jest`), the existing `src/**/__tests__/*.spec.ts` next to the code (davna's convention, kept on purpose), their helpers and the fakes in `__fakes__/` or `fakes/`. The checklist follows what the repository does, not a new style.
2. **Write the checklist in English, in the main folder, on a `docs/<name>-stage-8` branch** (its approval is a docs pull request merged into `main`, `docs/process/pull-requests.md`, section 2):
   - the pattern, in a short section;
   - cards in dependency order, one per package;
   - one `- [ ]` item per test, with the test file path and the rule it covers (`BR`, `UC`, `DM`, `AD`);
   - unit tests take their effects as fakes; a test that needs MongoDB or the root `.env` is an integration test and says so;
   - a section of open points, each with a recommendation;
   - what stays out, and why.
3. **Write no test until the user approves.** Their answers to the open points go into the document, with the date.

## The branch and its worktree

Right before the first test, once the pull request that approves stage 8 is merged, the session in the main folder updates `main` (`git pull --ff-only origin main`) and creates the branch and its worktree, outside every project tree (`docs/process/parallel-features.md`, sections 2, 3 and 8):

```bash
node scripts/worktree.js new <name>
```

- It creates `feat/<name>` from `main` and the worktree at `$WORKTREES_ROOT/davna/<name>`. It fails with a clear message when `WORKTREES_ROOT` is not set, or resolves inside this repository or a tree that contains it; then ask the user to set it (a folder outside any other project tree, e.g. `~/worktrees`). Don't pick one yourself.
- It never copies `.env` files: it prints which ones the main folder has, and the user copies only what the work needs. Never read their values.
- In the worktree: `yarn install` (Yarn 1 classic; if `yarn` is not on PATH, `corepack enable` or `npm i -g yarn@1`, which the user runs).
- From then on, the feature's folder under `docs/features/` changes only on the branch. A change to a skill, a setting or a process goes to `main` first, by its own docs pull request, and reaches the branch by the next sync.
- Commits on the branch name the folder and the branch: "Repo: davna, `$WORKTREES_ROOT/davna/<name>`, `feat/<name>`".

## While coding the tests

- Tick each item as its test lands.
- A test you need that isn't listed gets its item first, then the test.
- An item that no longer applies is struck through, never deleted.
- The API the tests fix, and the choices you made while writing them, go into a closing section of the checklist. Choices that need the user's word are listed apart, and they stay on the pending list until answered.
- Commits: `test: <what>` for the tests, with the user's authorization.

## Stage 9: the implementation checklist

`9.implementation.checklist.md` lists the code that makes the tests pass, in the order one package depends on another, with the critical path stated. After the pure code come the data changes, the Docker images and compose files, the retired procedures, the interface and the refactors (`docs/process/feature-stages.md`, section 2). At the end comes the go-live section (`references/go-live.md`).

- **TDD, always:** code only for a failing test. Run it and see it fail first.
- **The tests are the spec.** Never weaken a test to make it pass; if one looks wrong, ask the user.
- **A choice the documents and tests don't settle** goes to `agent.decisions.md` (SKILL.md, section 4).
- **A gap goes to `recommendations.md`,** not into the scope.
- **Rules in the domain, configuration outside the code.** Business rules are pure functions with their tests ([business rules](../../../../docs/patterns/business-rules.md)); domains, URLs, ids, keys and limits enter by parameter from the package's configuration module, never as a silent production default ([configuration](../../../../docs/patterns/configuration.md)).
- **The license header.** Every new `src/**/*.ts` carries it: `yarn add:header`, from `docs/license.header.txt`.
- **What the feature implements leaves the manual procedures together with it,** never before: the documented command, the script and the text. Stage 4 lists what leaves. A data change already applied in production is never edited; a new one is written (`docs/process/feature-stages.md`, section 4).
- **Type tests only fail under `tsc`.** Jest only transpiles (ts-jest with `isolatedModules`), so `@ts-expect-error` needs `yarn typecheck`.
- Commits: `feat: <what>` (or `fix:`, `refactor:`) for the code, with the user's authorization.

## Before every commit

1. **Run the checks of what changed** (`docs/process/gates.md`, section 1, "Merge into `main`"):
   - the tests of every workspace the change touches: `yarn workspace @davna/<package> test`, or `yarn test:modules` for every module;
   - `yarn typecheck`. While it is red on `main` (`docs/recommendations.md`, RG01 to RG03), compare `yarn typecheck:only-files` before and after: the change adds no file with errors;
   - the lint: `yarn workspace @davna/client-app lint` for the client, and ESLint with the root `eslint.config.mjs` on the touched packages (there is no root `lint` script yet);
   - when the change touches an app's build: `yarn workspace @davna/<app> build`;
   - `yarn add:header`, which must leave `git status` unchanged.
2. If a suite fails to run once and passes when rerun, alone and in full, report it as a flake, with what you saw. Don't hide it.
3. **Data changes:** try each one against the local Mongo of `docker-compose.yml` (`yarn api:up`; one stack per machine, `docs/process/parallel-features.md`, section 7), and query the result when the change alters state: the indexes (`getIndexes()`), the validator (`db.getCollectionInfos({ name: '<collection>' })`), the documents it touched (`countDocuments` on the same filter).
4. **Ask for the commit** with a summary of what goes in. State the repository, the folder and the branch the commit lands on ("Repo: davna"), and, for a merge, both branches. Use Conventional Commits in English and the attribution lines the session provides. Never commit on `main`: `main` changes only by merging a pull request (`docs/process/pull-requests.md`), and the `pre-push` hook refuses a push to it. Pushing the branch and opening its pull request is a separate yes, prepared by `/pull-request`.

## Syncing and merging

- **Sync by merge, never rebase** (`docs/process/parallel-features.md`, section 5): after every deploy with code and before the pull request's merge, `git fetch` and merge `origin/main` into `feat/<name>` in the worktree, then run the checks above, review the stages against what came in and run the sweep. The message is `chore: sync feat/<name> with main`.
- **The merge into `main`** is the merge of the branch's pull request on GitHub, with a merge commit (`gh pr merge <n> --merge`, never `--admin`, never auto-merge unless the user asks), whose message is the PR title plus `(#<n>)`, as in `feat: <what> (#12)`. It comes after the gate of `docs/process/gates.md`, section 1, with the required checks green, the self-review resolved and the production queue free (`docs/process/parallel-features.md`, section 6), and only with the user's yes. The pull request is prepared by `/pull-request`; what comes right after the merge is in `references/go-live.md`.
