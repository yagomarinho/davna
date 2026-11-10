# Path-filtered pipelines

**Status:** Proposed on 2026-11-10, brought from the author's pattern catalog. davna's only live workflows are the conformance ones, `.github/workflows/pr-body.yml` and `checks.yml`, which build and deploy nothing; this pattern says how a build or deploy pipeline is born, and why the conformance checks are not filtered.

Each build or deploy pipeline runs only when some file it uses changes. A docs-only pull request, and its merge, build and deploy nothing. The conformance checks that a pull request must pass are the exception: they always run, and keep cheap instead.

## Problem

- **Without a filter, every merge into `main` runs everything:** install, tests, the Docker builds, the image publication and the deploy, even when nothing they use changed. A new version, equal to the previous one, goes out.
- **The work process produces many docs-only commits:** a feature's stages, the registers of recommendations and decisions, the `CLAUDE.md` files and the production picture in `docs/system/`, each a pull request of its own. Each one, alone, would pay for the whole build and deploy.
- **In a monorepo with several apps,** a merge that changes only `apps/client.app` would rebuild and republish the backend images, and the other way around.

## Decision

- **Each pipeline declares its own path filter,** in its own configuration file.
- **A negative list** for the pipeline that depends on almost everything (the backend images, which bundle `shared/*`, `modules/*`, `services/*` and the root workspace files): it runs on everything **except** when every file is documentation. A positive list there would forget a new path and skip a needed deploy in silence.
- **A positive list** for the pipeline that depends on few paths (a single app whose dependencies are known): it runs **only** when what it reads changes.
- **Documentation is, by definition,** `docs/**`, `**/*.md` and `.claude/**`. **Nothing a build reads may be `.md` or live in `docs/` or `.claude/`.**
- **Required checks are not filtered at the workflow level.** A ruleset that requires a check makes every pull request wait for it; a workflow skipped by `paths-ignore` never reports, and the PR waits forever. So the conformance workflows (`pr-body.yml`: `pr-body`; `checks.yml`: `scripts`, `license-header`, `install-and-verify`) run on every pull request to `main` and every push to `main`, and stay cheap; a job that is expensive and only matters for some paths skips its steps inside the job, never the job itself.

### In GitHub Actions

```yaml
# pipeline that depends on almost everything: negative list
on:
  push:
    branches: [main]
    paths-ignore: ['docs/**', '**/*.md', '.claude/**']
  pull_request:
    branches: [main]
    paths-ignore: ['docs/**', '**/*.md', '.claude/**']
```

```yaml
# pipeline that depends on few paths: positive list
on:
  push:
    branches: [main]
    paths: ['apps/multimedia.processing/**', 'shared/**', 'package.json', 'yarn.lock']
  workflow_dispatch:
```

- GitHub skips the workflow only when **every** file of the push, or of the PR, matches `paths-ignore`. A PR that brings a document and any other file runs the whole workflow.

### On Vercel (`apps/client.app`)

The project's "Ignored Build Step" (or `ignoreCommand` in a `vercel.json` of the app) holds a positive list:

```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- apps/client.app package.json yarn.lock ':!**/*.md'"
}
```

- **The exit code decides:** if the command exits with **0**, Vercel cancels the build; with **1**, the build goes on. `git diff --quiet` exits with 0 when there is no difference in the listed paths.
- **The command runs in the project's root directory,** so the paths are written as that directory sees them; check the project's "Root Directory" setting before writing them.
- **The pathspec `':!**/*.md'`** removes the `.md` files, so a `CLAUDE.md` inside the app does not trigger the build.
- **`HEAD^`** compares with the previous commit, not with the last build: a merge commit compared with its first parent sees the whole PR, but a push of several commits where only an older one touched the app would be skipped. Prefer the commit of the last deploy when the project exposes it (`VERCEL_GIT_PREVIOUS_SHA`); an assumption to check at first use, in the build log.

## How it works

- **The deploy always starts from the tip of `main`.** A skipped merge leaves nothing behind: the next merge with code builds and deploys everything that is on `main`.
- **The review of every pull request still runs,** filtered or not ([Pull requests](../process/pull-requests.md)): its section 3.1 writes which workflows and deploys the merge triggers and why.

## How to use

- **A new file no build reads** (documentation, a guide, a skill): it lives in `docs/`, is `.md` or lives in `.claude/`, and changes no filter. `docs/license.header.txt` and `docs/project/*.drawio` are read by no build (the header is read only by `yarn add:header`, a development script).
- **A new file a build reads:** never `.md` nor in `docs/` or `.claude/`. If it must be, remove the path from the filter of the affected pipelines in the same pull request.
- **A new workspace package an app imports:** if the app's pipeline uses a positive list, the package's path goes into it.
- **A new pipeline or project:** it is born with its own filter, positive if it depends on few paths, negative if it depends on almost everything, and it goes into the table of "Where it is in the code".

## Limits

- **A required check on a PR:** if `main` requires the check of a workflow with `paths-ignore`, a docs-only PR keeps the check pending forever, because the workflow does not run. That is why `pr-body.yml` and `checks.yml` have no path filter ("Decision"); a build or deploy pipeline with a filter is never a required check.
- **Time-dependent tests** in a filtered pipeline do not run on a docs-only PR; they show up on the next PR with code.
- **Environment variables changed in the Vercel panel** change no file, so they trigger no build. After changing one, ask for a redeploy by hand.

## Discarded alternatives

- **A positive list on the pipeline that depends on almost everything:** each new package would require remembering to add its path, and forgetting would skip a deploy in silence.
- **`[skip ci]` in the commit message:** it depends on remembering at every commit, and docs commits are exactly the ones that repeat most.
- **Turning off automatic builds and publishing by hand:** it removes the guarantee that `main` is what is live. That is today's state for the images, and the review of each pull request compensates for it.

## Where it is in the code

| Pipeline                                   | Filter                                                                                                    | Form                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------- |
| Conformance checks (`.github/workflows/pr-body.yml` and `checks.yml`) | none at the workflow level: their jobs are required checks; `pr-body.yml` runs only on `pull_request`, also when the body is edited | always run, build and deploy nothing |
| Backend images (historical example only)   | `__github__example/__workflows__example/deploy.api.yml`, entirely commented, uses `dorny/paths-filter` jobs | per-job positive filters  |
| `apps/client.app` on Vercel                | not in the repository: whatever the Vercel project's settings hold, confirmed by the user                | unknown                   |

## Known deviations

- **No build or deploy pipeline.** The live workflows, `.github/workflows/pr-body.yml` and `checks.yml`, only check conformance. `__github__example/` is historical: a commented example kept untouched, not a pipeline, so nothing builds or deploys on a merge into `main`.
- **Stale paths in the example.** It filters `apps/api/**` and `apps/ffmpeg/**`, which no longer exist (today `apps/monolith.api` and `apps/multimedia.processing`), and it would not see changes in `shared/*`, `modules/*` or `services/*` that the images bundle.
- **Infrastructure of one deployment in the example.** The example publishes to a specific image registry account and deploys to a self-hosted runner from a base64 `.env` in the repository's secrets; a pipeline activated in davna takes its registry, host and secrets from configuration, not from the file.
