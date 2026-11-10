# Gates

A gate is a point where the work on a feature only goes on with what is pending resolved. At each one, each pending item has only two exits: **done** or **waived** by the user. Nothing leaves the list in silence.

---

# 1. The gates

| Gate                                 | What must be resolved                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start a stage                        | the previous stage accepted, with the acceptance written in it                                                                                                                                                                                                                                                                    |
| Write tests                          | the `8.tests.checklist.md` approved                                                                                                                                                                                                                                                                                               |
| Write tests in an improvement        | the improvement definition, citing the user decision that waives Stages 1 to 8 ([Improvements](improvements.md))                                                                                                                                                                                                                  |
| Write code                           | a red test for it                                                                                                                                                                                                                                                                                                                 |
| Change code in a refactoring         | the safety net approved and green ([Refactorings](refactoring.md))                                                                                                                                                                                                                                                                |
| Each commit, push and merge          | the user's explicit authorization, only for that commit, that push of a branch (with its pull request) or that pull request's merge, with the repository stated ("Repo: davna")                                                                                                                                                                                                                       |
| Merge into the integration branch    | the branch synchronized, the tests green and the ids inside the range                                                                                                                                                                                                                                                             |
| Merge into `main`                    | the open user decisions, the reviews, what is done by hand before the deploy, lint (ESLint with the root `eslint.config.mjs`; no root `lint` script exists yet), `yarn typecheck` and the tests of what changed (`yarn workspace <package> test`, or `yarn test:modules` for every module) green, and the MIT license header on every new `src/**/*.ts` (`yarn add:header`)                                                                                                     |
| Open a pull request                  | the review of [Pull requests](pull-requests.md), section 3, prepared by `/pull-request`, in the PR body, which `node scripts/pr-review.js check-body` and the `pr-body` job accept, and the terms the change brings in the glossary (`docs/system/language.md`, [pattern](../patterns/ubiquitous-language.md)) |
| Merge a pull request into `main`     | the gate "Merge into `main`" above, the branch up to date with `main`, the required checks green (`pr-body`, `scripts`, `license-header`), the self-review recorded and every conversation resolved, and the user's yes (`gh pr merge <n> --merge`, never `--admin`); when the change touches an app that ships as a Docker image, the new image built, published and proven running before the go-live ([pattern](../patterns/image-before-go-live.md)). `main` never changes by a direct push: the `pre-push` hook refuses it, and `--no-verify` is forbidden |
| Turn on in production                | the operational list of the [go-live](go-live.md)                                                                                                                                                                                                                                                                                 |
| Close the feature                    | the [closing](feature-closing.md): what comes after the deploy and the documents                                                                                                                                                                                                                                                 |

Today no merge into `main` deploys anything by itself: the repository's CI (`.github/workflows/checks.yml`) only checks conformance, and the Docker images and the server running `docker-compose.prod.yml` are updated by hand ([`docs/recommendations.md`](../recommendations.md), RG14). The review of the pull request still runs for every PR, including a stage acceptance, a fix and a documentation-only change, and it has no waiver as a whole: only item by item. When a merge does start a deploy (the Vercel project of `apps/client.app` connected to the repository), its authorization is asked saying so, and the review checks which deploys the merge starts.

While the known breakages ([`docs/recommendations.md`](../recommendations.md), RG01 and RG02) keep `yarn typecheck` red, the merge gate compares the files with errors (`yarn typecheck:only-files`) before and after the change: the change adds none, and the remaining ones are waived item by item, citing those items. On Windows, `yarn typecheck:only-files` is a POSIX pipeline (`grep`, `cut`, `sort -u`) that `cmd.exe` cannot run: run it from Git Bash with Yarn's script shell set to Git Bash (`yarn config set script-shell "<Git>/bin/bash.exe"`, which the user runs), or type the same pipeline directly in Git Bash: `yarn tsc -b --noEmit --pretty false 2>&1 | grep -E "^[^ ]+.ts" | cut -d'(' -f1 | sort -u`. Replacing it with a Node script is RG17.

With more than one branch open, the merge into the integration branch is that of a parallel session into the feature branch, and the merge into `main` also waits for the branch synchronized with `main` by merge, with the tests green, and for the production queue to be free: no other feature between its merge and the end of its "Turn on" group ([Parallel features](parallel-features.md)).

---

# 2. The pending items of a gate

At the merge and at the go-live, the list of pending items includes:

- the unchecked items of `8.tests.checklist.md` and `9.implementation.checklist.md`;
- the open decisions a stage left, such as a final section of open points in Stage 8;
- the items of the feature's `recommendations.md` whose trigger has arrived;
- the items of [`docs/recommendations.md`](../recommendations.md) whose trigger has arrived with this change, or that the change took;
- the decisions of `agent.decisions.md` without review.

---

# 3. Waiver

The user may go on with a pending item open. It stays in the checklist, without the done mark, with the note:

> **Waived** on YYYY-MM-DD by the user: the reason.

So what was left behind stays in sight in the next round, and nobody confuses it with what was done.

---

The other processes: [Feature stages](feature-stages.md), [Findings and decisions](findings-and-decisions.md), [Production procedures](production-procedures.md), [Pull requests](pull-requests.md), [Go-live](go-live.md), [Feature closing](feature-closing.md), [Parallel features](parallel-features.md), [Refactorings](refactoring.md) and [Improvements](improvements.md).
