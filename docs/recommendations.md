# Repository-level recommendations

The register of findings that belong to no feature, refactoring or improvement yet (ids `RGnn`; `G` is the reserved repository-level prefix). Nothing here is implemented before it becomes a decision in a change that takes the item. The rules are in [Findings and decisions](process/findings-and-decisions.md), section 4.

Items are never deleted: accepted, discarded or taken, each keeps its outcome. A change that takes an item cites it in its Stage 1 (or its refactoring or improvement definition) and marks it here.

---

## RG01. `monolith.api` imports packages that no longer exist

- **Type:** flow break
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** any change to `apps/monolith.api`, and before any deploy of the API image
- **Affects:** `apps/monolith.api` (`src/app/env.ts`, `src/app/create.ws.server.ts`, `src/app/multimedia.ts` and their tests)

**Today:** the API imports `@davna/classroom` and `@davna/feedback`, which became `@davna/classroom.management` and `@davna/costumers.insights`, deep paths such as `@davna/classroom/src/services/show.classroom`, and handlers that were removed (`createClassroomHandler`, `uploadAudioHandler`, `appendAndReplyHandler`, `connectToClassroomHandler`).

**Problem:** the API does not type-check nor build, so `yarn typecheck` stays red for the whole repository and no current image of the API can be produced.

**Proposal:** a refactoring that rewires the API to `classroom.management` and `costumers.insights` through their exported handlers only (no deep imports), with the existing app tests as the safety net, adapted where they import the removed packages. The generative reply over WebSocket that the old `appendAndReplyHandler` did is the boundary with RG02: either the API keeps a minimal reply path until the conductor exists, or the reply waits for RG02; that choice is the refactoring's first decision.

## RG02. `interaction.conductor` is a skeleton that does not compile

- **Type:** need
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** the first feature that changes how the agent replies in a classroom
- **Affects:** `apps/interaction.conductor`, `modules/classroom.management` (handlers and ports it will call), `apps/monolith.api` (the WebSocket reply path)

**Today:** `src/index.ts` is empty; `src/app/{app,env,routes}.ts` were copied from `multimedia.processing` and reference providers, services and handlers that do not exist in this app; `routes.ts` imports `Route` from `@davna/core`, which does not export it (it comes from `@davna/application`); `handlers/classroom.interaction.guidance.ts` and the services use names they never import; the persona and translation prompts are literal strings in `utils/ai.generate.response.ts`; the `Dockerfile` was copied from the ffmpeg app; `package.json` lacks `@davna/core` and `@davna/classroom.management`.

**Problem:** the app is meant to orchestrate the agent's reply (transcribe, translate, generate, synthesize speech, read the metadata, store the audio, append the agent's message, account for usage), but it has no stable contract, so nobody can build on it nor replace it.

**Proposal:** a feature that fixes the conductor's contract on davna's own terms: the trigger (unprocessed messages in a classroom, from the `Scheduler` or `Emitter` port of `classroom.management`), the handlers it calls (`fetchUnprocessedMessages`, `appendMessage`, `storeDerivedContents`, `checkMaxEstimatedConsumption`), the `agent` actor of `AuthContext` and the `idempotency_key`, with the model provider (`GPTModel`) and the persona and prompts as extension points coming from configuration. Any implementation that speaks the same contract can then replace the app.

**Alternatives:** keep the generative reply inside the API (RG01) and drop the conductor; this keeps one process but leaves the reply hard-wired to one provider and one persona.

## RG03. Dockerfiles, compose files, scripts and README use old names

- **Type:** flow break
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** the next image build, or the next change to `README.md`
- **Affects:** `apps/*/Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`, `scripts/api.tsc.monitor.js` (`yarn test:api-tsc`), `README.md`

**Today:** they reference `apps/api`, `apps/app`, `apps/ffmpeg`, `@davna/api`, `@davna/ffmpeg`, `@davna/classroom`, `@davna/feedback` and `package.build.json`, none of which exist.

**Problem:** the local stack (`yarn api:up`) and the image builds fail, and a newcomer following the README cannot run the project.

**Proposal:** a refactoring, after RG01 (and RG02 for the conductor's image), that renames every reference to the current apps and packages and checks it by building each image and bringing the local stack up healthy.

## RG04. Dependency cycle between `@davna/kernel` and `@davna/core`

- **Type:** recommendation
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** any change to `shared/kernel/src/entities/id.ts` or to `EntityURItoKind`, or before tests are added to `shared/core` (RG13)
- **Affects:** `shared/kernel`, `shared/core`, every package that uses `ID`

**Today:** `shared/kernel/src/entities/id.ts` imports `@davna/core` and augments its `EntityURItoKind`, while `@davna/core` imports `@davna/kernel`; the kernel's `package.json` also declares a dependency on itself. `@davna/core` also has a `kernel/` folder whose name collides with the package.

**Problem:** the layers stop having a direction (the kernel is meant to know nothing above it), a build or test tool that orders packages by dependency cannot do it, and the self-dependency is an error waiting for a stricter package manager.

**Proposal:** a refactoring that moves `ID` to `@davna/core` (or to `@davna/infra`), removes the self-dependency, and leaves `@davna/kernel` with no `@davna/*` import.

## RG05. Configuration read from `process.env` everywhere, with fallback values

- **Type:** recommendation
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** any change to an app's `env.ts` or `config/`, and before the next production deploy
- **Affects:** `apps/monolith.api/src/config/index.ts`, `apps/*/src/app/env.ts`, `services/ffmpeg/src/config.ts`, `shared/infra/src/providers/auth/firebase.admin.app.ts`, `apps/client.app/src/config/*` and the `client.app` services that read `process.env`

**Today:** each app and some packages read environment variables where they use them, and several fall back to built-in values when a variable is missing (an access token, an auth secret, a local MongoDB URL); the storage driver is chosen by `NODE_ENV`.

**Problem:** a missing variable does not stop the app; it starts with a value nobody chose, which is wrong in production and hides the mistake. Packages that read the environment themselves cannot be configured by the app that composes them.

**Proposal:** one configuration module per app, the only code that knows the variable names, with no fallback for any value that matters in production (the app refuses to start and says which variable is missing); the values reach packages and modules as parameters ([pattern](patterns/configuration.md)). The storage driver becomes an explicit setting.

## RG06. Configuration is not validated at startup

- **Type:** recommendation
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** together with RG05
- **Affects:** every app

**Today:** no app validates its configuration as a whole; a malformed URL or number is only found when the code that uses it runs.

**Problem:** configuration errors surface late, in production, far from their cause.

**Proposal:** the configuration module of RG05 validates the whole environment at startup with a schema. The repository's validation library is yup, already used by the DTOs, so the schema can be written with yup now; the maintainer's standard for configuration is zod, and moving to it belongs to RG09 ([pattern](patterns/configuration.md), [two-layer validation](patterns/two-layer-validation.md)).

## RG07. Package name typo: `costumers.insights`

- **Type:** improvement
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** the next change to the module, or RG01 (which already rewires its imports)
- **Affects:** `modules/costumers.insights` (`@davna/costumers.insights`) and its importers

**Today:** the module that captures leads and suggestions is named "costumers" instead of "customers".

**Problem:** the name leaks into imports, documentation and the glossary, and is harder to find.

**Proposal:** a refactoring that renames the folder and the package to `customers.insights`, ideally together with RG01, so that the API's imports change once. Projects that consume the package by name see a breaking rename, stated in its pull request.

## RG08. Deployment-specific values are hard-coded

- **Type:** recommendation
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** before anyone deploys davna under another name, or the next change to these files
- **Affects:** `apps/client.app/src/app/sitemap.ts`, `apps/client.app/src/app/robots.txt`, `apps/client.app/src/modules/feedback/pages/privacy.politics.tsx`, `docker-compose.prod.yml`, `README.md`

**Today:** the public site URL (sitemap and robots), the privacy contact e-mail and the Docker image names in the production compose are written in the code, pointing to one particular deployment. The production compose also pulls those images with the mutable `:latest` tag, so what runs is whatever was pushed last, not a known commit.

**Problem:** davna is an open-source project; whoever deploys it has to edit source files to remove someone else's site, contact and images, and a forgotten one publishes wrong information under their brand. With `:latest`, a deploy cannot be tied to a commit and a rollback has no tag to go back to ([image before go-live](patterns/image-before-go-live.md)).

**Proposal:** these values come from configuration (RG05): the site URL and the privacy contact from the client app's configuration, the image names and an immutable tag (the commit) from variables in the compose file, never `:latest`, with the README explaining how to set them.

## RG09. Align the stack with the maintainer's standard

- **Type:** opportunity
- **Status:** open (2026-11-10)
- **Origin:** onboarding of the repository to the feature process, 2026-11-10
- **Trigger:** after RG01 to RG03 make the repository build again; each step is its own refactoring, decided one at a time
- **Affects:** the whole repository

**Today:** Yarn 1 (classic) workspaces with `"*"` internal versions, no pinned package manager nor Node version (RG16), TypeScript `^5`, yup, Next.js 15 for `apps/client.app` with a mix of Tailwind 3 and `@tailwindcss/postcss` 4, and tests next to the code in `src/**/__tests__/`.

**Problem:** the maintainer's other projects use pnpm workspaces (with a catalog, `workspace:*` and strict dependencies), a validated configuration module with zod, TypeScript 6, React Router in framework mode and Tailwind 4; the difference costs context switching and keeps davna from sharing tooling and patterns with them. Some current problems (undeclared dependencies working by hoisting, RG15) would surface under strict dependencies.

**Proposal:** a sequence of refactorings, each with its safety net, in this order: (1) the package manager (pnpm, `workspace:*`, pinned versions), which exposes RG15; (2) the configuration module with zod (RG05, RG06); (3) TypeScript 6; (4) the client app (Tailwind 4 first, then whether to move from Next.js to React Router, decided on its own). The test location stays as it is unless a refactoring decides otherwise.

**Alternatives:** keep the current stack and adopt only the configuration module (RG05, RG06), which carries most of the safety benefit.

**Impact:** projects that build on davna consume its packages by name; a change of package manager or of internal versions changes how they install davna, and each step says so in its pull request.

## RG10. Make the `install-and-verify` check blocking

- **Type:** need
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10; reshaped the same day, when the pull request flow brought `.github/workflows/checks.yml`
- **Trigger:** RG01 to RG03 resolved, so that install, typecheck, the module tests and the lint are green on `main`
- **Affects:** `.github/workflows/checks.yml` (job `install-and-verify`), the ruleset on `main` (RG18), the gates of the process

**Today:** `checks.yml` runs on every pull request to `main` and every push to `main`. Its jobs `pr-body`, `scripts` and `license-header` are meant to be required checks. The job `install-and-verify` (`yarn install --frozen-lockfile`, the typecheck, `yarn test:modules`, the lint) runs with `continue-on-error: true`, because the code is red today (RG01 to RG03), so a regression in it does not block a merge.

**Problem:** while the job is not blocking, a red typecheck, test or lint can still reach `main`; the gates depend on the agent and the user comparing the red baseline locally ([gates](process/gates.md)).

**Proposal:** once the job is green on `main`, remove `continue-on-error` from its steps and add `install-and-verify` to the required checks of the ruleset ([Pull requests](process/pull-requests.md), section 6). Building or deploying from this repository's CI is out of scope: it only checks conformance (RG14).

## RG11. No versioned migration scripts for MongoDB

- **Type:** need
- **Status:** open (2026-11-10)
- **Origin:** onboarding of the repository to the feature process, 2026-11-10
- **Trigger:** the first feature whose Stage 6 changes an existing collection, an index or a validator
- **Affects:** Stage 6 of every feature, `docs/process/production-procedures.md`

**Today:** collections, indexes and validators are created by the code or by hand; there is no ordered, versioned record of the changes applied to each database.

**Problem:** a data change cannot be reviewed, repeated in another environment, nor told apart from what was already applied; "an applied migration is never edited" has nothing to apply to.

**Proposal:** versioned migration scripts (ordered files, each applied once and recorded in a collection of the database), runnable against the local Mongo of `docker-compose.yml` before production. Until then, each data change is written as a production procedure.

## RG12. No store for media outside git

- **Type:** improvement
- **Status:** open (2026-11-10)
- **Origin:** onboarding of the repository to the feature process, 2026-11-10
- **Trigger:** the first wireframe, screenshot or recording too heavy to commit
- **Affects:** `docs/features/*/2.wireframes/`, `docs/system/`

**Today:** documentation media are committed (the draw.io files in `docs/project/`).

**Problem:** heavy images and recordings would bloat the repository's history forever.

**Proposal:** keep wireframes light and committed for now; when heavy media appear, decide a store outside git with a pull and push script, recorded as a pattern.

## RG13. `shared/core`, `shared/application`, `services/ffmpeg` and `apps/client.app` have no tests

- **Type:** need
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** before any change to `shared/core`, `shared/application`, `services/ffmpeg` or `apps/client.app` (including RG04)
- **Affects:** `shared/core` (`@davna/core`), `shared/application` (`@davna/application`), and through them every module and app; `services/ffmpeg` (`@davna/ffmpeg.sdk`); `apps/client.app` (`@davna/client-app`)

**Today:** `@davna/core` (Either, Reader, entities, Service, Repository with its query builder and batch, UnitOfWorkSaga) has no spec and no `test` script; `@davna/application` (the Express adapter, `handlerPipe`, postprocessors) has none either. `shared/application/src/v2/` is under construction and not exported. `@davna/ffmpeg.sdk` (the HTTP client of `apps/multimedia.processing`) and `@davna/client-app` have no spec and no `test` script either.

**Problem:** the contracts every module relies on have no safety net, so any refactoring of them changes behavior blindly.

**Proposal:** characterization tests for the exported behavior of these packages, as the safety net of the first change that touches them, with a `test` script in each package.

## RG14. The deploy is manual

- **Type:** recommendation
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** after RG03 and RG08, or the first deploy that goes wrong by a missed step
- **Affects:** `docker-compose.prod.yml`, the images of the backend apps, the go-live of every feature

**Today:** the images are built and published by hand, and the server running `docker-compose.prod.yml` is updated by hand; `apps/client.app` is deployed on Vercel.

**Problem:** every deploy depends on someone repeating the steps in the right order, and nothing records which image tag is running.

**Proposal:** a scripted deploy (build, tag by commit, publish, pull and restart, check `/health`), always from a commit of `main`, with the image built and proven before the go-live ([pattern](patterns/image-before-go-live.md)). It does not run in this repository's CI, which only checks conformance ([Pull requests](process/pull-requests.md)): production builds and deploys belong to whoever deploys davna. davna's part is to make them possible: Dockerfiles that build (RG03), an immutable tag from configuration (RG08) and the steps documented. Until then, the deploy steps are production procedures in each feature's go-live.

## RG15. Modules use `@davna/core` without declaring it

- **Type:** recommendation
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** together with RG09 step 1, or any change to a module's `package.json`
- **Affects:** `modules/*`, `apps/interaction.conductor`

**Today:** `@davna/core` is declared only at the root and in `kernel`, `application` and `infra`; the modules import it and it works because Yarn hoists it.

**Problem:** a package's manifest does not tell what it needs; a stricter install, or a project that installs one module alone, breaks.

**Proposal:** every package declares every `@davna/*` and third-party package it imports.

## RG16. Package manager and Node version are not pinned

- **Type:** recommendation
- **Status:** open (2026-11-10)
- **Origin:** onboarding survey of the repository, 2026-11-10
- **Trigger:** the next change to the root `package.json`, or together with RG09 step 1
- **Affects:** the root `package.json`, the Dockerfiles, every contributor's machine

**Today:** there is no `engines`, `packageManager` nor `.nvmrc`; the Dockerfiles use `node:22-alpine` and the build targets `node20`; Yarn 1 must be installed by hand (`corepack enable`, or `npm i -g yarn@1`).

**Problem:** contributors and CI may run different Node and Yarn versions than the images, and the lockfile may drift.

**Proposal:** pin Node 22 and the package manager in the root `package.json` (and align the build target with the images).

## RG17. `typecheck:only-files` is a POSIX pipeline

- **Type:** recommendation
- **Status:** open (2026-11-10)
- **Origin:** review of the onboarding docs, 2026-11-10
- **Trigger:** the next change to the root `package.json` scripts, or the first merge gate run on Windows
- **Affects:** the root `package.json` (`typecheck:only-files`), the merge gate ([gates](process/gates.md)) and the pull request review ([Pull requests](process/pull-requests.md), section 3.2)

**Today:** `yarn typecheck:only-files` pipes `tsc` through `grep`, `cut` and `sort -u`. Yarn 1 runs scripts with the system shell, which on Windows is `cmd.exe`: `grep` and `cut` do not exist there, and `sort` is Windows `sort.exe`, which has no `-u`.

**Problem:** on Windows the command the merge gate and the pull request review depend on fails, unless Yarn's script shell is Git Bash or the pipeline is typed by hand in Git Bash.

**Proposal:** replace the pipeline with a small Node script in `scripts/` (pure function that extracts the file names from `tsc --pretty false` output, tested with `node:test`), so the command runs the same on every shell.

## RG18. Protect `main` with a ruleset on GitHub

- **Type:** need
- **Status:** open (2026-11-10)
- **Origin:** the pull request flow, decided with the user on 2026-11-10
- **Trigger:** the first pull request that `.github/workflows/pr-body.yml` and `checks.yml` run on, so that the check names exist
- **Affects:** the repository settings on GitHub, the `pre-push` hook, [Pull requests](process/pull-requests.md)

**Today:** `main` changes only by merging a pull request, but the only guard is the local `pre-push` hook (`node scripts/pr-review.js pre-push`), which a clone without `core.hooksPath` set, or `--no-verify`, skips.

**Problem:** without a ruleset, GitHub accepts a direct push to `main`, a force push, the deletion of `main`, a squash or rebase merge, and a merge with red checks or unresolved conversations.

**Proposal:** the user applies the settings of [Pull requests](process/pull-requests.md), section 6, with the prepared `gh api` commands: merge commits only, the merge commit titled by the PR, and a ruleset on the default branch requiring a pull request (no required approvals, conversations resolved, merge method `merge`), the status checks `pr-body`, `scripts` and `license-header` with the branch up to date, and blocking force pushes and deletion. The repository is public, so this costs nothing. Then the section's "Not exercised" mark goes, with the output that proved it.

## RG19. `add:header` duplicates the header on a CRLF checkout

- **Type:** flow break
- **Status:** open (2026-11-10)
- **Origin:** the review of the first pull request, 2026-11-10
- **Trigger:** the next change to `scripts/add.header.js`, or the first time `yarn add:header` runs on a Windows checkout
- **Affects:** `scripts/add.header.js`, `docs/license.header.txt`, every `src/**/*.ts` file

**Today:** `scripts/add.header.js` compares the start of each file with the text of `docs/license.header.txt` exactly. On a Windows checkout with `core.autocrlf=true`, the files are CRLF, and the comparison fails whenever the header file and the source file differ in line endings.

**Problem:** run on such a checkout, `yarn add:header` prefixes a second header to hundreds of files that already have one, and the diff goes unnoticed until review. CI (LF) is not affected, so the `license-header` check stays right.

**Proposal:** compare with the line endings normalized (CRLF taken as LF in both texts), in a pure function tested with `node:test` on LF and CRLF inputs, and write the header with the file's own line ending.
