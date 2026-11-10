# Go-live

How an implemented feature goes to production and is turned on. The go-live is a section of `9.implementation.checklist.md`, not a conversation: the list lives in the repository and survives a new session.

---

# 1. The operational list

It is born from Stage 7 (what is done by hand, the validation, what comes after the deploy) and has four groups, in this order:

- **Prepare:** what is done before the merge (environment variables in the server's `.env` and in the Vercel project, accounts and keys at the providers, decisions, the Docker images built, published and proven running, with their tags noted here).
- **Ship:** the branch synced with `main`, `/pull-request`, the pull request opened, its self-review and checks, and its merge; right after it, the feature's worktree and branch removed (`node scripts/worktree.js remove <name>`, which refuses a dirty or unmerged worktree and never deletes the remote branch) and the `origin` branch deleted with the command the script printed, with the user's yes; then the deploy and what it waits for (DNS, certificates, keys, health checks).
- **Turn on:** what puts the feature in use. It goes in sequence, without a pause, when a pause between the steps has a cost.
- **After:** what can only come with the feature in production (tightening a validator, dropping an old field or index, retiring a manual procedure).

Each item states:

- **who runs it:** the user or the agent;
- **the effect:** read, reversible, irreversible or write to production;
- **the check:** the expected output that proves it worked;
- **what it blocks,** when it blocks something.

What was done gets the mark and the date, and stays in the document. A waived pending item follows the [gates process](gates.md). When the list is shown in a conversation, only the pending items appear.

---

# 2. The deploy

- **Before the pull request, `/pull-request`.** `main` changes only by merging a pull request. For every PR, that of a feature, a refactoring, a fix, a stage acceptance or only documentation, the user runs the skill `/pull-request`. It checks the branch, runs the local checks, sweeps the documents and checks the go-live, takes to the glossary (`docs/system/language.md`, [pattern](../patterns/ubiquitous-language.md)) only the terms the change brings, fills the PR body with the review and checks it, and asks for the authorization to push the branch and open the PR. The merge waits for its own yes. It does not redo the rest of `docs/system/`.
- **The production picture, on demand.** Redoing the whole picture of production (the survey of the code, the data model and the deploy, the documents of `docs/system/` and the full glossary check) at every pull request would cost too much, so it is split from the cheap, mandatory part of each PR. `/pull-request` runs for every PR; `/architecture-survey` redoes `docs/system/` when the user asks, or when `/pull-request` reminds that the picture fell behind, by the pull requests merged since it ([Pull requests](pull-requests.md)). The header of each document states the `main` commit it describes ("Production picture on YYYY-MM-DD, up to commit `<short sha>`"), and what was merged after it is in the pull requests merged into `main` since that commit.
- **Before the pull request, the review.** The environment variables each app reads, the images and tags, what the merge starts, the rules of the architecture and what the deploy will expect from someone are checked item by item, and the record goes in the PR body; without it, `check-body` and the required `pr-body` check refuse it ([Pull requests](pull-requests.md)).
- **Today no merge into `main` deploys by itself.** This repository's CI (`.github/workflows/checks.yml`) only checks conformance and deploys nothing; the API and the multimedia service run from the images named in `docker-compose.prod.yml`, which the user builds, publishes and pulls on the server by hand; `apps/client.app` runs on Vercel. Production builds and deploys are not scripted in this repository ([`docs/recommendations.md`](../recommendations.md), RG14). The review states, for each pull request, whether its merge deploys anything (for example, whether the Vercel project is connected to the repository).
- **A change that is not additive** breaks the code in production until the new code is up (a renamed field, a removed route, a changed WebSocket event that `apps/client.app` already relies on); so the deploy goes in a calm, agreed window, and the order between the API images and the client deployment is written in "Ship".
- **One feature with code at a time.** With other branches open, the next feature only merges into `main` after this one finishes its "Turn on" group ([Parallel features](parallel-features.md)).
- **A documentation-only pull request deploys nothing.** `checks.yml` runs on it, and only checks; a pipeline that builds or deploys must ignore `docs/**`, `*.md`, `.claude/**` and the editor configuration (`.vscode/**`), and run only with the paths it uses ([pattern](../patterns/ci-triggers.md)). While the feature has no code branch, its stage acceptances may be merged into `main` at any time, without a window; the docs commit of `/pull-request` only deploys together with the code of the same PR, and the `/architecture-survey` PR, documentation only, deploys nothing.
- **The Docker image comes before the go-live.** A change that touches an app shipped as an image (`apps/monolith.api`, `apps/multimedia.processing`, and `apps/interaction.conductor` once it ships), its `Dockerfile`, its base image or its dependencies only has its merge asked for with the new image built, published and proven running (its `/health` answering), and with the tag noted in the "Prepare" group ([pattern](../patterns/image-before-go-live.md)).
- **The steps of each product** (DNS, certificate, keys, the server's `.env`, the Vercel project) follow the [production procedures](production-procedures.md).

---

# 3. Validating the infrastructure

The Stage 7 spike validates what the unit tests do not reach (a real OpenAI call, the ffmpeg conversion inside the image, the GridFS or S3 storage, the WebSocket through the real network). Before planning it on a throwaway branch, check that this is possible: the local `docker-compose.yml` (`yarn api:up`, `yarn api:down`) brings up `mongo`, `ffmpeg` and `api` and is the first place to try, once its old paths are fixed ([`docs/recommendations.md`](../recommendations.md), RG03). What only production can show becomes a series of checks right after the deploy, inside the "Turn on" steps. Each check states what it proves and what the expected output is.

---

The other processes: [Feature stages](feature-stages.md), [Findings and decisions](findings-and-decisions.md), [Gates](gates.md), [Production procedures](production-procedures.md), [Pull requests](pull-requests.md), [Feature closing](feature-closing.md), [Parallel features](parallel-features.md), [Refactorings](refactoring.md) and [Improvements](improvements.md).
