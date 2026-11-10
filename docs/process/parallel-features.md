# Parallel features

How two or three sessions work at the same time on the same machine, on different changes or on parts of the same change, without one stepping on the other's work. Every session that writes code has its own folder, a git worktree, and its own branch. What exists only once (the `main` branch, production, the local Docker stack, the ports of the machine) is still used by one session at a time. `main` changes only by merging a pull request on GitHub ([Pull requests](pull-requests.md)).

Inside each branch, the other processes apply as always: the [stages](feature-stages.md), the [gates](gates.md), the [registers](findings-and-decisions.md) and the [go-live](go-live.md). This document only says what changes when more than one branch is open.

---

## 1. What runs in parallel

| Work                                                          | In parallel?                                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The specification of a change while another one is being coded | Yes. It is documentation only, and its docs pull requests reach `main` without deploying anything                                    |
| Parts of stage 9 of one feature                               | Yes, when one does not depend on the other's code and they do not touch the same files (optional section 9). Stage 8 tests already fix each package's API |
| Two changes with code in the same repository                  | No: one change with code at a time per repository (section 6)                                                                        |
| Reviews, analyses and sweeps that only read                   | Yes, without a worktree                                                                                                              |
| Two stages of the same feature                                | No: each stage starts from the previous one, accepted                                                                                |
| The merge of a pull request with code, the deploy and the go-live | No: one change at a time (section 6)                                                                                              |
| The local Docker stack (`docker-compose.yml`)                 | No: one per machine (section 7)                                                                                                      |

---

## 2. Folders, branches and worktrees

Worktrees live **outside every project tree**, under a root folder that the user chooses once and exports as the environment variable `WORKTREES_ROOT` (a folder outside any other project tree, e.g. `~/worktrees`). Each repository gets its own subfolder, named after the basename of `git rev-parse --show-toplevel`; for this repository that is `davna`.

| Folder                                    | Branch                                               | Who writes in it                                                                                                                                                                          |
| ----------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The main folder of the repository         | rests on `main`; a short-lived `docs/<name>` branch while a docs change is committed and pushed | one session at a time: the specification of a change that has no code branch yet, the process and pattern docs, the registers, `/architecture-survey`, each on its `docs/<name>` branch and pull request; the update of `main` after each merge |
| `$WORKTREES_ROOT/davna/<name>`            | `feat/<name>` (feature or improvement), `fix/<name>`, `refactor/<name>` or `chore/<name>`, the integration branch | the change's integration session, including its `/pull-request`                                                                                                          |
| `$WORKTREES_ROOT/davna/<session>`, optional | `claude/<session>`, cut from the integration branch | one parallel session of the same change (section 9)                                                                                                                                       |

Why outside the tree:

- **No context leaks.** A session opened in a worktree reads only that checkout's `CLAUDE.md` files; no ancestor folder adds rules from another checkout or another project.
- **No duplicate code for the tools.** Jest, ESLint and `tsc` running in the main folder never walk into a copy of the repository, so no ignore entry is needed in `.gitignore`, `config/eslint` or the Jest config.
- **The main folder stays clean:** `git status` there never lists a worktree.

Rules:

- **One folder, one session that writes.** Two sessions in the same folder switch each other's branch and files. Sessions that only read may share a folder.
- **The main folder rests on `main`.** It leaves `main` only for a short-lived `docs/<name>` branch, created right before a docs commit and left right after its push (`git switch main`); whoever needs a code branch opens a worktree. After each merge on GitHub, the main folder updates `main` with `git pull --ff-only origin main`; `main` is never committed on, so the pull is always a fast-forward.
- **The integration branch is born with the tests.** The specification (feature stages 1 to 7 and the stage 8 checklist until it is approved; a refactoring's stages until the safety net is approved) reaches `main` by small docs pull requests from the main folder, one per acceptance, because a docs-only change deploys nothing ([pattern](../patterns/ci-triggers.md)). When the first test is about to be written, the session in the main folder creates the branch and its worktree with `scripts/worktree.js` (section 3). From then on, the change's folder under `docs/features/`, `docs/improvements/` or `docs/refactorings/` only changes on that branch, so `main` and the branch never edit the same file.
- **Two specifications at the same time:** both are documentation and both reach `main` by docs pull requests from the main folder, one session at a time. A second session that must write a specification while the main folder is busy works in a worktree on its own `docs/<name>` branch cut from `main` (`node scripts/worktree.js new <name> --type docs`) and opens its own docs pull request at every acceptance. It is documentation only, so that merge does not enter the production queue (section 6).
- **Names do not nest.** Git does not accept `feat/x` and `feat/x/y` at the same time, because a branch cannot also be a folder of branches. That is why parallel sessions use `claude/<session>`.

---

## 3. `scripts/worktree.js`

A plain Node script (CommonJS, no dependencies) that creates, lists and removes this repository's worktrees. Its decisions (path resolution, validation and the plan of git commands) are pure exported functions, tested with `node:test` in `scripts/__tests__/worktree.spec.js`; the command line only runs the plan.

| Command                                                         | What it does                                                                                                                                                                                                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/worktree.js new <name> [--type feat\|fix\|refactor\|chore\|docs] [--base main]` | creates the branch `<type>/<name>` (default `feat`) from the base (default `main`) and its worktree at `$WORKTREES_ROOT/davna/<name>`; for an existing branch, it only adds the worktree                                                       |
| `node scripts/worktree.js list`                                 | lists this repository's worktrees and their branches                                                                                                                                                                                                 |
| `node scripts/worktree.js remove <name>`                        | removes the worktree and deletes the branch with `git branch -d`. It refuses when the worktree has uncommitted changes or the branch is not merged. It never uses `-D` and never deletes the branch on `origin`: it prints the `git push origin --delete <branch>` command, which is a push and needs the user's authorization, after the pull request is merged |

- **It fails with a clear message** when `WORKTREES_ROOT` is not set, or when it resolves inside this repository or inside any project tree that contains it.
- **It never touches `.env` files.** It prints which `.env*` files exist in the main folder, so the user copies the ones the work needs (section 8). The agent never reads their values.
- `<name>` is the change's slug: the folder `docs/features/NNN.feature.<name>/` gives the branch `feat/<name>`, and `docs/refactorings/NNN.refactoring.<name>/` gives `refactor/<name>`.

---

## 4. Register ids

- **Between different changes,** the id prefix already separates the ids (each feature, refactoring and improvement chooses its own prefix), and nothing changes.
- **Ids are never renumbered,** because code cites them: test names and comments carry ids such as `RA07`.
- **The repository-level register** (`docs/recommendations.md`, prefix `G`) is written from the main folder only, on a `docs/<name>` branch merged by pull request.
- Ranges per parallel session are in section 9.

---

## 5. Where branches meet

What more than one branch changes, and how each conflict is solved:

| What                                                                         | The risk                                                                                                     | How it is solved                                                                                                                                                       |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn.lock`                                                                  | a conflict at every new package or dependency                                                                | never by hand: accept one side, run `yarn install` and commit the lock it generates                                                                                    |
| The `workspaces` of the root `package.json` and the `references` of the root `tsconfig.json` | new lines on both sides                                                                                      | both stay                                                                                                                                                              |
| The `CLAUDE.md` files                                                        | two branches change the same rule, command or table                                                          | both versions stay, merged into one; no `CLAUDE.md` holds the state or history of a change, which live in its folder                                                   |
| The data shape (MongoDB collections, entity versions such as `ParticipantVersion`, indexes) | two changes touch the same entity or collection: the text does not conflict, but one of the stages becomes wrong | the change that arrives later reviews its stages 4 to 7 against what came in and records what changed; versioned migration scripts are not available yet ([`docs/recommendations.md`](../recommendations.md), RG11), so a data change that is not additive is decided with the user |
| The model and the contracts (DTOs, routes, handlers, ports)                  | two changes touch the same contract                                                                          | the change that arrives later reviews its stages 4 to 7; when in doubt, the user decides                                                                               |
| The diagrams in `docs/project/*.drawio`                                      | draw.io files merge badly                                                                                    | one author at a time; a branch that needs a new diagram creates a new page or file                                                                                     |
| `docs/system/` and its diagrams                                              | they describe production                                                                                     | the picture only changes from the main folder, by `/architecture-survey`, on demand, in its own docs pull request; the glossary, also by `/pull-request`, with the change's terms, in the change's pull request |
| The privacy policy (`apps/client.app/src/modules/feedback/pages/privacy.politics.tsx`) | one text, describing what is in production                                                                   | each change edits the policy on its own branch, and the edit goes live with its deploy; the next change reviews the text when it syncs                                |
| The change's registers and checklists                                        | new items at the end of the file and in the index                                                            | all stay, in id order                                                                                                                                                  |

### Dependencies between changes

- **When change B depends on what change A is still changing** (an entity, a role, a contract), B may be specified on A's accepted model. B's stages cite A's stage and section and say it is not in production yet.
- **B's code only starts after A reaches `main`.** A branch never starts from another change's branch: that would tie the two merges together and carry A's code into `main` inside B's merge.
- **When A reaches `main`,** B reviews the stages that depended on it before writing its tests.

### Syncing with the origin branch

Each branch updates from the branch it started from: the integration branch from `origin/main` (after a `git fetch`), a parallel session's branch from the integration branch.

- **By merge, never by rebase.** Branches go to `origin`, and a rebase would force a push.
- **When:**
  - after every deploy with code, every open integration branch syncs at once, so its distance from `main` does not grow;
  - before each branch's merge into its target (for the integration branch, before its pull request is merged: the required checks are strict, so GitHub refuses a branch behind `main`);
  - in a parallel session, also when it needs what already came into the integration branch.
- **After merging the origin, on the branch:**
  1. conflicts solved as the table above says;
  2. `yarn install`, `yarn typecheck`, the tests of every workspace the branch touches (`yarn test:modules`, `yarn workspace @davna/<package> test`), the lint (`yarn workspace @davna/client-app lint` for the client; ESLint with the root `eslint.config.mjs` for the rest; there is no root `lint` script yet) and the builds of the apps it touches (`yarn workspace @davna/<app> build`). `checks.yml` runs again on the pull request, but the local checks come first;
  3. the change's stages reviewed against what came in;
  4. the state sweep of the `feature-workflow` skill.
- **The merge commit** is `chore: sync <branch> with <origin>`, as in `chore: sync feat/conductor-contract with main`, and needs the user's authorization, like every commit.

---

## 6. Merges and the production queue

- **Into `main`, only by pull request.** The integration branch reaches `main` by its pull request, merged on GitHub with a merge commit (`gh pr merge <n> --merge`), whose message is the PR title plus `(#<n>)`, as in `feat: <what> (#12)` ([Pull requests](pull-requests.md)). The integration session merges each parallel session's branch locally, in its worktree.
- **Always a merge commit,** never squash or rebase, so the history shows what each branch brought and a whole change can be reverted at once (`git revert -m 1`). A local merge uses `git merge --no-ff`, with the message `chore: merge claude/<session> into feat/<name> (<the part>)`.
- **Each merge needs the user's yes:** the request says the folder (or the PR), the source branch and the target branch.
- **The merge into the target has no conflict,** because the branch has just synced. If it has, the target moved after the sync: the branch syncs again.
- **One change with code at a time per repository.** The change merges into `main` and follows the [go-live](go-live.md) to the end of its "Turn on" group (`/pull-request`, the pull request and its merge, the deploy and the checks) before another change with code merges. A failure in the deploy or in a check then has one cause, and each merged pull request tells one change at a time. A docs-only pull request does not enter the queue. When "Turn on" waits on a third party for days, the user may release the queue, like a waiver ([gates](gates.md)).

---

## 7. What exists once on the machine

- **The local Docker stack.** `docker-compose.yml` fixes the container names (`mongo`, `ffmpeg`, `api`) and the ports (`27017`, `3334`, `3333`), so only one stack runs per machine, whatever folder starts it. One session at a time uses it: before, it stops any running stack (`yarn api:down` in the folder that started it) and starts its own (`yarn api:up`); afterwards, it says in its report that it used it. Integration tests that need MongoDB share the same database.
- **The ports of the dev servers:** `apps/client.app` (`next dev`), `apps/monolith.api` and `apps/multimedia.processing` listen on fixed ports; a second `dev` of the same app fails or moves to another port.
- **The Yarn cache and the Docker login** belong to the machine and serve every worktree.

---

## 8. A new worktree

- **Dependencies:** `yarn install` in the worktree (Yarn 1 classic; if `yarn` is not on PATH, `corepack enable` or `npm i -g yarn@1`). The `pre-push` hook already applies, because `core.hooksPath` lives in the repository configuration that every worktree shares ([Pull requests](pull-requests.md), section 4).
- **Files outside git:** `.env` files never come with a worktree. `scripts/worktree.js new` lists the ones the main folder has; the user copies only what the work uses:
  - unit tests use none; integration tests read the root `.env`, which `config/jest/jest.setup.js` loads relative to the checkout, so in a worktree it is the worktree's own `.env`;
  - the Docker stack reads `.env.dev`; `apps/client.app` reads its own `.env` (see its `.env.example`).
- **Claude Code in a worktree:**
  - a session opened in the worktree reads the skills, settings, hooks and `CLAUDE.md` files of that checkout, which is the branch's. A change to a skill, a setting or a process therefore goes to `main` first, by its own docs pull request, and reaches the branch by the next sync;
  - automatic memory is shared by every worktree of the repository;
  - on Windows, a permission approved with "don't ask again" stays in that worktree only.

---

## 9. Optional: parallel sessions inside one change

Use this only when the user asks for it, for parts of stage 9 that do not share files.

- **The branches.** Each parallel session has its own worktree under `$WORKTREES_ROOT/davna/<session>`, with a `claude/<session>` branch cut from the integration branch. `scripts/worktree.js` does not create these branches yet; the integration session creates them with git:

  ```bash
  git worktree add "$WORKTREES_ROOT/davna/<session>" -b claude/<session> feat/<name>
  ```

  If the session was opened by the app with its own worktree option, the base may not be the integration branch. Before starting, the session checks it with `git merge-base --is-ancestor feat/<name> HEAD`; if it did not start there, and the branch has no work yet, it is recreated from the integration branch with `git switch -C claude/<session> feat/<name>`. The session returns to the integration branch by merge, never directly to `main`.

- **The briefing.** The integration session opens each parallel session with a briefing that says:
  - **the part:** the cards of `9.implementation.checklist.md`, or the task, and what "done" is (the cards' tests green and the items ticked);
  - **the files that are its own:** packages and folders. It does not touch the others; if it needs to, it stops and asks;
  - **the id ranges** it may use in the change's registers;
  - **what it does not use:** the local Docker stack and the fixed dev ports, unless the integration session hands them over (section 7);
  - **the usual rules:** TDD, the tests are the specification, and commits only with the user's authorization.
- **Id ranges.** Each parallel session reserves, in the briefing, the next free ten of `recommendations.md` and `agent.decisions.md`, e.g. `DCA40` to `DCA49` and `RA20` to `RA29`. The integration session continues its own sequence and skips the reserved ranges. At the merge into the integration branch, the items of both branches all stay, in id order, and the unused part of a range gets one line: "`DCA45` to `DCA49`: range of session `<session>`, not used". Ids stay increasing and are never reused ([findings and decisions](findings-and-decisions.md)); with ranges, the sequence may have gaps.
- **The end.** The integration session merges each `claude/<session>` branch with `--no-ff` and the user's authorization, then removes its worktree (`git worktree remove`) and deletes the branch with `git branch -d`.

---

## 10. The end of a branch

- **Right after the pull request is merged,** the main folder pulls `main` (`git pull --ff-only origin main`) and the worktree and the branch go: `node scripts/worktree.js remove <name>`. With `-d`, git only deletes a branch already merged into its target; if it refuses, that is a finding to investigate, never a reason for `-D`. The branch on `origin` goes right after, with `git push origin --delete <branch>`, which is a push and needs authorization. A fix that shows up later, in the go-live, goes on a new `fix/<name>` branch with its own pull request, like any other change.
- **A session does not remove the worktree it runs in.** The session in the main folder removes it after the worktree's session has ended, with the user's yes.
- **Archiving an app session does not remove its worktree right away,** and "Archive anyway" discards what was not committed. That is why the worktree and the branch go through git (the script) after the merge, and only then is the session archived.
- **A folder deleted without git** leaves an entry in `git worktree list`; `git worktree prune` removes it.
- **The final check:** `node scripts/worktree.js list` and `git worktree list` without the worktree, `git branch -a` without the branch, and `git ls-remote --heads origin` without it after the remote deletion.
- **The state sweep** replaces sentences such as "on branch `feat/<name>`" with the new state ([feature closing](feature-closing.md)).

---

## 11. The choices of this process

Decided by the user on 2026-11-10:

- **Worktrees outside every project tree,** under `$WORKTREES_ROOT/<repo-name>/<name>`, created and removed by `scripts/worktree.js`. Discarded: worktrees inside the repository (`.claude/worktrees/`), which leak the main folder's context into the session and make Jest, ESLint and `tsc` see duplicate code.
- **Only `main` as a long-lived branch,** changed only by merging pull requests, and the main folder resting on it.
- **Sync by merge, never rebase; merge commits only (`--no-ff` locally, the merge method on GitHub); every merge authorized.**
- **One change with code at a time per repository.**
- **Parallel sessions inside one change** (the `claude/<session>` branches and id ranges) kept as an optional section.

---

The other processes: [Feature stages](feature-stages.md), [Findings and decisions](findings-and-decisions.md), [Gates](gates.md), [Production procedures](production-procedures.md), [Pull requests](pull-requests.md), [Go-live](go-live.md), [Feature closing](feature-closing.md), [Refactorings](refactoring.md) and [Improvements](improvements.md).
