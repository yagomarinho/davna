# Roadmap

What davna intends to do next, in order, and why. A roadmap item is an intention, not a specification: each one becomes a feature, a refactoring or an improvement by the process in `docs/process/`, and from then on its state lives in that change's folder, not here. This file only points to it.

> **Draft.** This is the first version of the roadmap, written while its format is still being found. The format may change; ids are never reused and items are never deleted.

## Goal

1. **Plug and play.** Anyone can `git clone` davna, set a small configuration (an AI connection: a provider, a fake or a local agent) and run it locally, with data that survives a restart and no cloud account.
2. **Near-zero idle cost.** The same code runs in production on an architecture that costs close to nothing when nobody is using it.

The audiences, in order: people who want to use davna (self-hosting), then people who want to contribute.

## Principles

These guide every item below. They are recorded here until an item writes them down as accepted patterns in `docs/patterns/`.

- **Hexagonal and modular.** The core is isolated behind ports; every database, auth provider, file store, queue and AI connection is an adapter at the shell, chosen by configuration. Clean architecture for the dependency direction.
- **Functional style with light DDD.** Pure functions decide; repositories, the app / route / controller split and use cases are used where they help, and DDD is never an absolute rule.
- **Repositories hide the database.** A repository adapter owns its internal schema and migrations; swapping the database never changes behavior. The same contract specs run against every adapter of a port.
- **Small steps.** Style changes (errors as data, the functional kernel) arrive gradually, inside the changes that touch the code, never as one large rewrite.
- **Extension points over forks.** What someone may want to replace (the interaction conductor, the AI connections) is a contract with davna's own implementation as the default.

## Now

### RM01. Yarn 1 classic to pnpm

- **Outcome:** the repository installs and runs with pnpm workspaces, with the package manager and Node version pinned.
- **Becomes:** refactoring.
- **Takes:** RG16 (package manager and Node version not pinned); touches RG09 (stack alignment).
- **Depends on:** —
- **Tracked in:** —

### RM02. Architecture record

- **Outcome:** the principles above become accepted patterns: the hexagonal module layout, the ports and adapters, the functional style, the light-DDD pieces, the configuration module and the contract specs for adapters.
- **Becomes:** docs change (patterns), then applied by the items below.
- **Takes:** RG04 (kernel / core cycle), RG05 and RG06 (configuration), as decisions to apply.
- **Depends on:** —
- **Tracked in:** —

## Next

### RM03. Persistent local profile

- **Outcome:** a `local` profile that runs without any cloud account: PGlite repositories, local auth, files in a local folder, a demo seed, and a `doctor` command that says what is missing in the configuration. The `cloud` profile requires every value explicitly.
- **Becomes:** refactoring (ports and adapters), with features where behavior is new (local auth, seed).
- **Takes:** RG03 (old names in compose and scripts), RG08 (hard-coded deployment values), RG11 (migrations), RG12 (media store).
- **Depends on:** RM01, RM02.
- **Tracked in:** —

### RM04. AI connections and a simplified admin

- **Outcome:** the AI capabilities (conversation, transcription, speech) are separate ports; a simplified admin connects each one to a provider, a fake or a local agent over HTTP or gRPC. Secrets are never logged or shown back.
- **Becomes:** feature.
- **Depends on:** RM03.
- **Tracked in:** —

### RM05. Task tree and the conductor as an extension point

- **Outcome:** the interaction conductor (transcribe, answer, synthesize, store, account for usage) runs as a task tree behind a contract, with davna's implementation as the default and room for other implementations.
- **Becomes:** feature.
- **Takes:** RG02 (the conductor skeleton).
- **Depends on:** RM04.
- **Tracked in:** —

## Later

### RM06. One Lambda behind API Gateway, with jobs and polling

- **Outcome:** the monolith runs as a single Lambda behind API Gateway in production and on Express locally, from the same app. The teacher's reply becomes an asynchronous job (`202` plus polling) instead of a socket; the job queue is a port (in process locally).
- **Becomes:** refactoring plus infrastructure, with a CI/CD pipeline on GitHub Actions.
- **Takes:** RG01 (missing imports in the API), RG14 (manual deploy).
- **Depends on:** RM03, RM05.
- **Tracked in:** —

### RM07. Where ffmpeg runs

- **Outcome:** a decision, driven by response time, on how media conversion runs (in process, a separate function, or a worker), and its implementation.
- **Becomes:** decision inside the architecture refactoring, then a refactoring.
- **Depends on:** RM06.
- **Tracked in:** —

### RM08. `client.app` to React Router 8 on Netlify

- **Outcome:** the client app moves from Next.js to React Router 8 in framework mode, deployed on Netlify, talking to the API by polling.
- **Becomes:** refactoring.
- **Takes:** RG13 (client app without tests), as far as the migration goes.
- **Depends on:** RM01, RM06.
- **Tracked in:** —

## Done

None yet.

## Dropped

None yet.
