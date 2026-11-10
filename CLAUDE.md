# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It keeps only what applies to the whole repository on every call: the rules, the commands, the conventions, the traps and where to look. A package with its own commands, contracts or traps keeps them in its own `CLAUDE.md`, which Claude Code loads when working in that folder. What the system is, how each change was built and where it stands live in `docs/` (see "Where to look").

davna is an open-source (MIT) repository and stands on its own: its process, skills, features, registers, commits and pull requests are its own. Projects that build on davna consume its extension points (ports, contracts, packages); davna never depends on them, never names them and never takes a change that only one of them needs. A need from such a project becomes a davna feature, refactoring, improvement or fix written on davna's own terms: a generic extension point, port or contract.

## Rules

- **Never commit without the user's explicit authorization.** This is a direct order from the user. Ask before each commit and wait for a clear yes; an approval covers only the commit it was given for. The same holds, each asked separately, for pushing a branch and opening its pull request, and for merging a pull request: none implies another. The user's `/pull-request` authorizes only preparing the PR (the checks, the sweep, the body), no commit and no push. `/architecture-survey` carries no authorization: it asks for its commit like any other.
- **`main` changes only by merging a pull request.** Every change (a stage acceptance, a feature, a refactoring, an improvement, a fix, docs only) goes on its own branch (`docs/`, `feat/`, `fix/`, `refactor/`, `chore/`) and reaches `main` by a pull request on GitHub, titled as a Conventional Commit and merged with a merge commit, never squash or rebase, never `--admin`. Before opening it, run `docs/process/pull-requests.md` item by item for that exact tip: what the merge triggers, the whole change green, the limits of the hosts and providers, the architecture rules, the parameters and secrets by name, what the deploy waits on, the gates that already existed. The record is the PR body, from `.github/pull_request_template.md`, checked by `node scripts/pr-review.js check-body` and by the `pr-body` job of `.github/workflows/pr-body.yml`. The `pre-push` hook (`.githooks/pre-push`, which runs `node scripts/pr-review.js pre-push`) refuses any push to `main`, and `--no-verify` is never used. This is a direct order from the user.
- **Discussion is not an order to edit.** When the request is a question, an analysis or a call for suggestions, answer with the analysis and a recommendation, and touch files only when the user says to apply it. Propose what was not asked for instead of folding it into the change.
- **No configuration strings inline.** Domains, URLs, ids, collection names, header names, limits, keys and any other value that can change outside the code live in the package's configuration module (`config/env.ts` validates the environment variables and is the only place that knows their names; `config/index.ts` groups the values and the project's fixed names), never in the middle of the code, and the code receives them as parameters. Production values are never silent defaults. This is a direct order from the user; the pattern is `docs/patterns/configuration.md`. Today's code reads `process.env` all over and falls back to insecure defaults (`docs/recommendations.md`, RG05 and RG06): new code follows the pattern, and never copies the old shape.
- **Business rules are decided in the domain, without exception.** Pure, tested functions decide; MongoDB, Google Sheets, S3, the providers (OpenAI, Firebase), the HTTP and WebSocket layers and the components only deliver facts, execute and give support (indexes, `$jsonSchema` validators, uniqueness, idempotency keys). This is a direct order from the user; the pattern is `docs/patterns/business-rules.md`.
- **TDD.** Every new behavior starts with its tests: write the unit tests that describe it, run them and see them fail, then write the code that makes them pass, and refactor with the tests green. Don't write code before a failing test exists for it. The tests are the spec: never weaken one to make it pass; if one looks wrong, ask the user.
- **Errors are data, and logs carry nothing private.** Services return `Either` from `@davna/core`; new errors follow the Proposed patterns `docs/patterns/errors.md` and `docs/patterns/functional-style.md` (a layer, a name and a stable code, never ad hoc `{ status, message }` objects), which guide new cases until the user accepts them. No conversation content, audio, transcription, personal data, prompt, model output or secret goes into a log or an error detail.
- **Secrets and production belong to the user.** Never read or ask for a secret's value: the user types it in the panel or the shell, and the check is by name, length or prefix. The user runs everything that writes to production (the server, the image registry, the Vercel project, MongoDB, the providers' consoles); the agent prepares the command with its expected output and checks the result (`docs/process/production-procedures.md`).

## Overview

Monorepo for davna (`@davna/davna`), a language-practice classroom where the student talks to an AI teacher by audio, with Yarn 1 workspaces: `apps/*` deployable code, `modules/*` business modules (bounded contexts), `services/*` clients of davna's own services, `shared/*` the shared kernel and the concrete infrastructure, `config/*` tooling config. Packages are named `@davna/<name>`, usually the folder's name (`apps/client.app` is `@davna/client-app` and `services/ffmpeg` is `@davna/ffmpeg.sdk`). Each module has `dtos/`, `entities/`, `repositories/`, `services/` and `handlers/`; no module imports another, and the apps compose them. What is in production, and where, will be in `docs/system/overview.md` once the first `/architecture-survey` writes it.

| Folder                         | What it is                                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `apps/client.app`              | `@davna/client-app`: Next.js 15 (App Router) front end, landing, login, dashboard and classroom (Vercel)                   |
| `apps/monolith.api`            | HTTP and WebSocket API (Express 5, socket.io, port 3333) that composes the modules (Docker image)                          |
| `apps/multimedia.processing`   | FFmpeg service (port 3334): audio metadata and conversion to AAC (Docker image)                                            |
| `apps/interaction.conductor`   | The future orchestrator of the AI teacher's reply; a skeleton that does not compile yet (RG02)                             |
| `modules/identity.access`      | Accounts and sessions: login through the `Auth` provider, refresh, revoke and verify of the session JWT                    |
| `modules/access.control`       | Roles: the `Role` entity, `getRole` and the `mergeRoles` middleware                                                        |
| `modules/classroom.management` | The product's core, a graph of vertices and edges: classrooms, participants, messages, audio, usage policies               |
| `modules/costumers.insights`   | Leads and suggestions stored in Google Sheets (the name's typo is RG07)                                                    |
| `modules/system.monitoring`    | The `/health` handler every app mounts                                                                                     |
| `services/ffmpeg`              | `@davna/ffmpeg.sdk`: HTTP client of `apps/multimedia.processing`                                                           |
| `shared/kernel`                | Generic types and utilities, and the `ID` entity (the cycle with `core` is RG04)                                           |
| `shared/core`                  | Functional DDD base: `Either`, `Reader`, `Entity`, `Handler`, `Service`, `Repository`, `UnitOfWorkSaga`                    |
| `shared/application`           | HTTP adapter over Express 5: `Application`, `Route`, `handlerPipe` (the `v2/` folder is not exported)                      |
| `shared/infra`                 | Concrete ports: MongoDB, in-memory, Google Sheets and federated repositories; S3 and GridFS storage; Firebase, JWT, OpenAI |
| `config/jest`, `config/eslint` | Shared Jest and ESLint config                                                                                              |
| `scripts/`                     | Repository scripts: license header, cleanup, worktrees, the pull request checks and the hooks setup                        |
| `.github/`                     | `pull_request_template.md` (the PR body), `workflows/pr-body.yml` and `workflows/checks.yml` (the conformance checks; nothing builds or deploys) |

The original design drawings are in `docs/project/` (`system.architecture.drawio`, `database.models.drawio`, `use.cases.drawio`); keep them as they are.

## Commands

Run from the repository root with Node 22 (the Docker images use `node:22-alpine`) and Yarn 1 classic. If `yarn` is not on PATH, enable it with `corepack enable` or install it with `npm i -g yarn@1`. Package commands are in each package's `CLAUDE.md` or `package.json`.

```bash
yarn install                              # also runs prepare, which enables .githooks (scripts/hooks.js)
yarn typecheck                            # tsc -b --noEmit over the solution (red on main today: RG01, RG02)
yarn typecheck:only-files                 # only the names of the files with type errors; compare base and tip (POSIX: Git Bash on Windows, RG17)
yarn tsc -p <folder> --noEmit             # one package
yarn test:modules                         # the test script of every modules/* package, with a summary
yarn workspace @davna/<package> test      # one package; add a path or -t "<test name>"
yarn workspace @davna/infra test          # shared/infra, with --experimental-vm-modules; part of it needs MongoDB and .env
yarn workspace @davna/<app> build         # a backend app: typecheck of tsconfig.build.json, then esbuild
yarn workspace @davna/client-app lint     # eslint in the client; there is no root lint script yet
yarn workspace @davna/client-app build    # next build --turbopack
yarn api:up                               # the local Docker stack: mongo 27017, ffmpeg 3334, api 3333 (.env.dev)
yarn api:down                             # stop it
yarn add:header                           # prefix the MIT header to every src/**/*.ts that lacks it
yarn rm <folder>                          # delete <folder> (e.g. dist, node_modules) in every workspace
yarn test:scripts                         # node:test specs of scripts/ (scripts/__tests__/)
yarn worktree new <name> [--type feat|fix|refactor|chore|docs] [--base main]   # also: list, remove <name>
yarn pr-review:check <body-file>                                # a PR body; must print pr-review: ok
gh pr create --base main --title "<type>: <what>" --body-file <body-file>
gh pr merge <n> --merge                                         # only with the user's yes; never --admin
```

- There is no root `test` or `lint` script yet. `yarn test:api-tsc` still builds the old `@davna/api` name and does not work (RG03).
- ESLint runs on the touched packages with the root `eslint.config.mjs`; ESLint ignores `.js` files, so `scripts/` is checked by its `node:test` specs and Prettier only.

## Testing

- A feature's stage 8 is a test checklist (`8.tests.checklist.md`) the user approves before any test is written, and stage 9 is the implementation checklist (`9.implementation.checklist.md`). Tick their items as the work lands.
- Specs live next to the code they test, in `src/**/__tests__/*.spec.ts`, with fakes in `__fakes__/` or `fakes/` folders beside them. This is davna's existing convention, and new tests follow it. Only `*.spec.ts(x)` files run, so helpers never run as tests.
- Unit tests call nothing real: no MongoDB, S3, OpenAI, Firebase or Google Sheets; effects come in as fakes (the in-memory repositories of `@davna/infra`, `FakeAI`). Integration specs that need the local stack or the root `.env` (in `shared/infra` and `apps/monolith.api`) say so, and a unit test never depends on a value from `.env` (`config/jest/CLAUDE.md`).
- Jest only transpiles: type errors are caught by `yarn typecheck`, not by the tests.
- `shared/core`, `shared/application`, `services/ffmpeg` and `apps/client.app` have no tests yet (RG13): cover a behavior before changing it.
- The repository scripts (`scripts/pr-review.js`, `scripts/worktree.js`, `scripts/hooks.js`) are plain CommonJS with their decisions in pure exported functions, tested with `node:test` in `scripts/__tests__/`.

## Dependencies

- Node 22 everywhere (the Docker images and local); esbuild targets `node20`. Neither Node nor Yarn is pinned yet (RG16).
- Yarn 1 classic workspaces: `apps/*`, `config/*`, `modules/*`, `services/*`, `shared/*`. Internal packages use the version `"*"`. There is one `yarn.lock`; on a conflict, never edit it by hand: accept one side, run `yarn install` and commit the lock it generates.
- Packages are consumed as source (`main: index.ts`) and have no build of their own; only the apps build.
- Several modules use `@davna/core` without declaring it and work by hoisting (RG15): a new import of an internal package goes into the importing package's `package.json`.
- yup validates the DTOs; zod is the author's standard, and the migration is a recommendation (RG09), not something to start inside another change.

## TypeScript

- TypeScript `^5`. `tsconfig.base.json`: ES2022, NodeNext, `strict` with `noImplicitAny: false`, `noEmit`. Each package extends it with `include: ["src"]`.
- The root `tsconfig.json` is a solution file that references every TS package; a new package must be added to its `references`. Its `tsBuildInfoFile` is `/tsconfig.info`, so `tsc -b` writes that file at the root of the drive.
- Backend apps have a `tsconfig.build.json` that leaves the specs out, checked before esbuild bundles.

## Lint and format

- The ESLint 9 flat config lives in `config/eslint` (`@davna/eslint`), re-exported by the root `eslint.config.mjs`: typescript-eslint, React and React Hooks, Jest, import and Prettier. Imports from a parent folder (`../../`) are forbidden, components are arrow functions, unused variables only with the `_` prefix, and `no-console` is a warning.
- Prettier (`.prettierrc.json`): no semicolons, single quotes, trailing commas, `arrowParens: "avoid"`, width 80. `.editorconfig`: 2 spaces, LF, UTF-8.
- File and folder names are `dot.case` (`show.classroom.ts`, `classroom.management`).
- On Windows, `core.autocrlf=true` checks files out with CRLF, and lint then fails `prettier/prettier` with "Delete `␍`". The files are LF in git, so this only affects local runs. The `.githooks/pre-push` hook must stay LF, which `.gitattributes` enforces (`.githooks/* text eol=lf`, `*.sh text eol=lf`), and must be committed executable: the user adds it with `git add --chmod=+x .githooks/pre-push`, because with `core.filemode=false` git records it as `100644` and Linux and macOS then skip the hook without a word.

## License header

- Every `src/**/*.ts` file starts with the MIT header from `docs/license.header.txt`. After creating a `.ts` file, run `yarn add:header` (it skips `.tsx`, `*.spec.ts` and build folders) and commit the result; the `license-header` check of `.github/workflows/checks.yml` fails when it would leave a diff.
- Every `package.json` declares `"license": "MIT"`.

## Deployment

- **This repository's CI only checks conformance.** `.github/workflows/pr-body.yml` runs `pr-body` on every pull request to `main`, and `.github/workflows/checks.yml` runs on every pull request and every push to `main` (the merges): `scripts`, `license-header` and `install-and-verify` (shown as failed but not blocking while the code is red, RG10). It uses no secret, builds no image and deploys nothing. `__github__example/` is a historical, commented example, kept untouched.
- **Today no merge into `main` deploys anything by itself.** The backend apps (`apps/monolith.api`, `apps/multimedia.processing`) ship as Docker images started on a server by `docker-compose.prod.yml`, built and pushed to the registry by hand (RG14); `apps/client.app` deploys on Vercel. Production builds and deploys happen outside this repository's CI. The review of the pull request still runs for every PR.
- When a merge does start a deploy (the Vercel project connected to the repository), its authorization is asked saying so, and each build or deploy pipeline runs only when what it uses changes (`docs/patterns/ci-triggers.md`).
- A backend change goes live only with its image built from the commit, started and healthy, with an immutable tag (`docs/patterns/image-before-go-live.md`); `docker-compose.prod.yml` still pulls `:latest` (RG08).
- The Dockerfiles, the compose files and the README still name old packages and paths (RG03), so an image build from `main` fails today.
- MongoDB has no versioned migration scripts yet (RG11): a data change that is not additive is decided with the user. Media has no store outside git yet (RG12).
- The local Docker stack and the dev servers' ports are one per machine (`docs/process/parallel-features.md`, section 7).

## Features

Each feature is specified in English in `docs/features/NNN.feature.<name>/`, in the nine stages of `docs/process/feature-stages.md`, and covers only what it adds; the earlier features' stages still apply. The stages are a base, not the source of truth: once code exists, the code, the tests and accepted decisions win. Where a feature stands is in its own folder (the acceptance recorded in each stage, the stage 8 and 9 checklists, the registers' indexes), and the production picture in `docs/system/`, as of the commit its headers name.

| Feature | Folder | Id prefix |
| ------- | ------ | --------- |

- Each feature chooses its own id prefix in stage 1, different from every other change's, and never `G`, which is reserved for the repository-level register.
- Work on a feature follows `docs/process/` through the project skill `feature-workflow`, which opens features from its English templates (`.claude/skills/feature-workflow/templates/`). A change that keeps the behavior (names, structure, packages, patterns) is a refactoring: `docs/process/refactoring.md`, applied by the project skill `refactoring-workflow`, in `docs/refactorings/`. A behavior a feature in production already specified, brought to another app with no new rule, contract, stored data or term, is an improvement: `docs/process/improvements.md`, in `docs/improvements/`; the user's decision that it is one waives stages 1 to 8, and TDD still holds.
- Gaps found in a review or while implementing go to the change's `recommendations.md`, and the decisions the agent takes alone to its `agent.decisions.md`, pending the user's review. What belongs to no change yet goes to `docs/recommendations.md` (`RGnn`). Ids are never reused, and items are never deleted (`docs/process/findings-and-decisions.md`).
- The gates, waivers and the go-live are `docs/process/gates.md` and `docs/process/go-live.md`; a change closes by `docs/process/feature-closing.md`.
- The privacy policy (`apps/client.app/src/modules/feedback/pages/privacy.politics.tsx`) must describe what the system actually does with personal data: a change that alters that updates it on its own branch.

## Parallel work

The rules are in `docs/process/parallel-features.md`.

- One writing session per folder. The main folder rests on `main`, leaving it only for a short-lived `docs/<name>` branch while a docs change is committed and pushed: the specification (feature stages 1 to 7 and the stage 8 checklist until approved; a refactoring's stages until the safety net is approved, one docs pull request per acceptance), the process and pattern docs, the registers and `/architecture-survey` happen there. After each merge on GitHub, the main folder updates with `git pull --ff-only origin main`.
- Code and tests live on `feat/<name>` (a feature or an improvement), `fix/<name>`, `refactor/<name>` or `chore/<name>`, in a git worktree **outside every project tree**: `$WORKTREES_ROOT/davna/<name>`. `WORKTREES_ROOT` is an environment variable the user sets once, to a folder outside any other project tree, e.g. `~/worktrees`. `yarn worktree new <name>` creates the branch and the worktree, `list` shows them and `remove <name>` removes them; the script refuses a root inside this repository or inside a project tree that contains it, and never touches `.env` files (it lists the ones to copy). From the first test on, the change's folder in `docs/` only changes on its branch.
- One change with code at a time in this repository. Branches sync by merge, never by rebase (`origin/main` merged into the branch, `chore: sync <branch> with main`); local merges use `--no-ff`, and pull requests are merged with a merge commit; every merge needs the user's authorization, naming the folder (or the PR) and both branches. Right after the pull request is merged, `yarn worktree remove <name>` deletes the worktree and the branch (`git branch -d`, never `-D`); the copy on `origin` goes right after, with `git push origin --delete <branch>`, which needs its own authorization.
- A session opened in a worktree reads that checkout's skills, settings, hooks and `CLAUDE.md` files, which are the branch's. So a change to a skill, a setting or a process goes to `main` first, by its own docs pull request, and reaches the branch at the next sync.
- Parallel sessions inside one change (`claude/<session>` branches, id ranges) are optional: section 9 of the process.

## Where to look

- `docs/system/`: the production picture, up to the commit of `main` its header names; created and rewritten by the project skill `architecture-survey` (`/architecture-survey`, run only by the user). It carries no authorization.
- The pull requests on GitHub: the history of every change to `main`, each with its review in the body. The project skill `pull-request` (`/pull-request`, run only by the user, before every PR) prepares them; it authorizes no commit and no push, brings the change's terms to the glossary and reminds when the picture falls behind (5 or more merged PRs).
- `docs/process/`: how a change goes from stage 1 to production, one process per document (stages, findings and decisions, gates, production procedures, go-live, closing, parallel features, pull requests, refactoring, improvements).
- `docs/features/`, `docs/refactorings/`, `docs/improvements/`: one folder per change, each with its README as the index. The project skills `feature-workflow` and `refactoring-workflow` are used by the agent whenever the work moves a feature, an improvement or a refactoring forward; they carry no commit authorization.
- `docs/recommendations.md`: the repository-level register (`RGnn`), seeded with today's known debts.
- `docs/patterns/README.md`: solutions the repository reuses, all Proposed today. Follow them in new cases and record new ones there. The ubiquitous language (`ubiquitous-language.md`) keeps one name per concept, with the terms coming from the user.
- `docs/project/*.drawio`: the original design drawings. `docs/license.header.txt`: the MIT header.

## Conventions

- **English everywhere in this repository:** `CLAUDE.md` files, `docs/`, skills, code comments and commit messages. This overrides the author's personal default of Portuguese docs and comments, for this repository only; the conversation with the user may still be in Portuguese, but nothing written to the repository is.
- **Conventional Commits in English:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, with a body in bullets when the change is large (e.g. `docs: accept stage N of feature NNN (<name>)`, `chore: sync feat/<name> with main`). A pull request's title follows the same form, and its merge commit is the title plus `(#<n>)`.
- **Only `main` is a long-lived branch,** and it changes only by merged pull requests. Everything else is a short-lived `docs/<name>`, `feat/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>` or `claude/<session>`.
- A `CLAUDE.md` keeps only rules, commands, conventions, traps and pointers. History, dates, decision ids, implementation state and the detail of the architecture go to `docs/`.
