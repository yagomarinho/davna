---
name: pull-request
description: Prepares the pull request that takes a change into main (a stage acceptance, the code of a feature, a refactoring or an improvement, a fix, docs only), because main changes only by merging a pull request on GitHub. Checks the terrain (the branch, a clean tree, origin/main merged into the branch when it is behind), runs the local checks, sweeps the docs for stale state and ticks the go-live, brings to the glossary (docs/system/language.md) only the terms the change brings, fills the PR body from .github/pull_request_template.md with the review of docs/process/pull-requests.md item by item (what the merge triggers, the whole change green, the limits of the hosts and providers, the architecture rules, variables and secrets by name, what the deploy waits on, the earlier gates), checks it with node scripts/pr-review.js check-body, and after the user's yes pushes the branch and opens the PR with gh. Then suggests the self-review /code-review --comment and leaves the merge to the user's explicit yes. Reminds the user to run /architecture-survey when 5 or more pull requests were merged since the commit the production picture names. It makes no commit and no push on its own authority. Only the user runs it, with /pull-request.
argument-hint: '[feature, refactoring or improvement folder, like 001.feature.name or 001.refactoring.name, or the subject of the change, like fix-upload-mime-type]'
disable-model-invocation: true
model: opus
effort: high
---

# Pull request

`main` changes only by merging a pull request on GitHub (`docs/process/pull-requests.md`). This skill is the step before every PR, whatever it carries: a stage acceptance, a feature's code, a refactoring, an improvement, a fix, docs only. It is the cheap part, and it is mandatory. The production picture (`docs/system/`, its two diagrams and the full glossary check) is not refreshed here: that is `/architecture-survey`, on demand, and this skill reminds the user when the picture falls behind (`docs/process/go-live.md`, section 2).

`main` is what production is built from, but this repository's CI (`.github/workflows/checks.yml`) only checks conformance: it builds no image and deploys nothing. The Docker images and `docker-compose.prod.yml` are built and started by hand today, and `apps/client.app` deploys on Vercel; the review still runs for every PR, so whoever deploys a commit of `main` finds it ready.

The processes this belongs to are `docs/process/pull-requests.md` (the flow, the review, the template and the checks), `docs/process/go-live.md` and `docs/process/feature-closing.md`, and, for a refactoring, `docs/process/refactoring.md`, for an improvement, `docs/process/improvements.md`; the gates are in `docs/process/gates.md`. The feature process skill, `feature-workflow`, and the refactoring one, `refactoring-workflow`, point the user here before every PR. The glossary follows `docs/patterns/ubiquitous-language.md`.

## Authorization

The user typing `/pull-request` authorizes **only preparing the PR**: the reads, the checks, the doc edits of the sweep, the go-live ticks and the glossary, and the PR body in a temporary file. It authorizes no commit and no push. Each of these waits for its own clear yes in the conversation, and none implies another:

- **each commit:** the sync merge of `origin/main` into the branch, and the commit of the docs this skill touched;
- **pushing the branch and opening the PR;**
- **merging the PR** (`gh pr merge <n> --merge`), never with `--admin`, and never by auto-merge unless the user asks for it;
- **deleting the branch on `origin`** after the merge.

Before each commit, push or merge, state the repository: "Repo: davna".

## Steps

### 1. Check the terrain

- **The repository.** `git rev-parse --show-toplevel`: its basename is `davna`.
- **The branch.** `git branch --show-current` is the change's branch, never `main`: `docs/<name>` in the main folder (spec, process, registers, the production picture), or `feat/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>` in its worktree (`node scripts/worktree.js list`; `docs/process/pull-requests.md`, section 2.1). If the work sits uncommitted on `main` in the main folder, propose creating the `docs/<name>` branch from it (`git switch -c docs/<name>`), with the user's yes. If unsure, ask.
- **A clean tree.** `git status` must show nothing but what belongs to this change. If there are other changes, stop and ask: they don't go into its commits.
- **Up to date with `main`.** After a `git fetch`, `git rev-list --count HEAD..origin/main`. When it is more than 0, propose merging `origin/main` into the branch (`git merge --no-ff origin/main`, message `chore: sync <branch> with main`), never a rebase, as a commit that needs the user's yes; then run the checks of step 2 again on the result. The ruleset requires the branch up to date, so GitHub refuses the merge otherwise.
- **The change is done.** Stage 9 of the feature, the refactoring's `4.implementation.checklist.md` or the improvement's `3.implementation.checklist.md` has its code done and its tests green; a stage acceptance has the acceptance written in the stage; a fix has its tests. If not, say what is missing; the gates of `feature-workflow` or `refactoring-workflow` still apply.
- **What goes in:** `git log --oneline origin/main..HEAD` and `git diff --name-only origin/main...HEAD`. Read the change's folder (the stage, the stage 9 checklist and its go-live, or the refactoring's or improvement's definition and implementation checklist) to know what it does and what it advances.

### 2. Run the local checks

On the exact tip, the checks of `docs/process/pull-requests.md`, section 3.2, that the change's files reach: `yarn typecheck` (compare `yarn typecheck:only-files` on `origin/main` and on the tip while it is red, RG01 to RG03), the tests of every workspace touched (`yarn test:modules`, `yarn workspace @davna/<package> test`), the lint (`yarn workspace @davna/client-app lint`; ESLint with the root `eslint.config.mjs` on the touched packages), the build of each app it changes (`yarn workspace @davna/<app> build`), `yarn test:scripts` (or `node --test scripts/__tests__/*.spec.js`), and `yarn add:header` leaving `git status` unchanged. A docs-only change runs only `yarn test:scripts` when it touched a script, and nothing else. If dependencies are not installed, say so and which checks could not run.

### 3. Sweep the docs and tick the go-live

Run the state sweep of `feature-workflow` (section 5), or the refactoring sweep of `refactoring-workflow` for a refactoring, with the change's own words. Read each hit in context and update only what this change makes false, with the date.

- **The go-live.** The items already done in the go-live section (the stage 9 checklist, or the refactoring's or improvement's implementation checklist) get `[x]` and the date. The PR, its merge and what comes after stay open until they happen.
- **`docs/system/` stays out,** except the glossary (step 4). It is the picture up to the commit its header names, and only `/architecture-survey` rewrites it. A line there that this change makes false goes to the report, not into an edit.
- **The `CLAUDE.md` files hold no state.** A state sentence found in one moves to the change's docs, and a `CLAUDE.md` only changes when a rule, a command, a convention or a trap did (`docs/process/feature-closing.md`, section 1).
- **`docs/recommendations.md`.** An `RGnn` item the change took becomes accepted when its code reaches `main`, pointing to the decision that resolved it (`docs/process/findings-and-decisions.md`, section 4).

### 4. Bring the change's terms to the glossary

Only what this change brings, so it stays cheap. A change with no terms (most fixes, a docs-only PR) skips this step.

- **The terms.** The ones the feature's stage 1, or the refactoring's definition, accepted as new or changed go to their context in `docs/system/language.md`, with the name in the code, the word on screen (pt-BR, as `apps/client.app` shows it), the words not to use and the meaning ([ubiquitous language](../../../docs/patterns/ubiquitous-language.md), "The glossary"). A term whose code isn't in this PR stays out.
- **The legacy names.** A rename the change did removes its row from the legacy names table; a rename it deferred gets a row, with its register item and trigger.
- **The header.** Keep the one `/architecture-survey` wrote, and add right below it one line for this change: "Terms of <change> brought on YYYY-MM-DD by `/pull-request`." The next survey takes these lines into its header.
- **No glossary yet.** Before the first `/architecture-survey`, `docs/system/language.md` doesn't exist. Create it with only the change's terms, under a header "Glossary started on YYYY-MM-DD by `/pull-request`, before the first production picture", and say in the report that the full check waits for `/architecture-survey`.
- **Not here:** the search for the "Do not use" words and for legacy names without a register, and the check of the "In the code" column against the code. Those are the full check of `/architecture-survey` ([ubiquitous language](../../../docs/patterns/ubiquitous-language.md), "The check").

### 5. Count the merged PRs since the picture

- **The picture's commit:** the one the header of `docs/system/overview.md` names ("up to commit `<sha>`").
- **The count:** the pull requests merged into `main` after that commit, `git log --merges --first-parent --oneline <sha>..origin/main`, plus this one.
- **5 or more:** the picture is behind. Tell the user the count and the picture's date, and suggest `/architecture-survey` after this merge; only the user runs it.
- **No `docs/system/overview.md`:** there is no picture yet. Say so, and suggest `/architecture-survey` after this merge.
- **The threshold** is a proposal that the user adjusts. It lives here and in `docs/process/pull-requests.md`, section 3.7: change both.

The count is the answer to the body's item "the production picture" (step 6).

### 6. Fill the PR body

**Never open a PR without this review, complete, for this exact tip.** Follow `docs/process/pull-requests.md`, section 3, item by item: what the merge triggers (3.1), the whole change green on the exact tip (3.2), the limits of the server and the providers (3.3), the architecture rules (3.4), the variables, secrets and registry by name only (3.5), what the deploy will wait on (3.6), and the gates that already existed (3.7). A docs-only PR has the short review of section 3.8.

- **Read, don't assume.** Each item is a command run now, against the repository, the local Docker stack or the local database, with its output, or a confirmation the user gives in the chat for what only they see (the server, the image registry, the Vercel panel, the consoles of the MongoDB host, AWS S3, Firebase, Google Cloud and OpenAI, the DNS) (`docs/process/pull-requests.md`, section 3). A value taken from a stage document, or from an earlier PR, doesn't count. The reads follow `.claude/skills/architecture-survey/references/survey.md`.
- **The body:** copy `.github/pull_request_template.md` to a temporary file outside the repository (the session's scratch folder, or `"$(mktemp)"` in Git Bash), and fill it: the line citing what the PR advances (`Feature NNN, stage N`, `Feature NNN`, `Refactoring NNN`, `Improvement NNN`, `RGnn`, `fix: <what>`, or, when it advances none of them, `Production picture up to <short sha>` or `Process: <doc>`; `Closes #n` when it closes an issue), and every item of the seven sections with its result after ` — `. An item that doesn't apply says why. Only the user waives an item, and only one at a time, with the **Waived** note of `docs/process/gates.md`, section 3.
- **The title** is a Conventional Commit in English: `feat: <what>`, `fix: <what>`, `refactor: <what>`, `chore: <what>`, or `docs: accept stage N of feature NNN (<name>)`. It becomes the merge commit's message, with `(#<n>)`.
- **A blocking finding** (a red test the change adds, a missing variable, an image that doesn't build or start, a provider limit too low) stops the skill here: tell the user what it is, the fix and who does it. Don't open the PR around it.
- **Check the body:** `node scripts/pr-review.js check-body <file>` (or `yarn pr-review:check <file>`) prints `pr-review: ok`. The `pr-body` job of `.github/workflows/checks.yml` runs the same check on GitHub.

### 7. Check the docs and ask for their commit

- **Every relative link** in the docs this skill touched resolves.
- **No secret** got into a document or into the PR body: no tokens, keys, passwords or connection strings.
- **The format:** `yarn prettier --write --end-of-line lf` on the Markdown it touched (Prettier comes with `@davna/eslint`; if dependencies are not installed, say so and leave the format to the user).
- **The commit.** When the sweep, the go-live ticks or the glossary changed files, ask for one commit with only those files, on the change's branch, with the message `docs: prepare <subject> for review` and the attribution lines the session provides. It needs the user's yes like any other. After it, re-run step 6's check if the body cites the tip.

### 8. Ask to push the branch and open the PR

Tell the user, briefly:

- the PR's title and what it advances;
- what the merge will trigger, from the body's section 1: the jobs of `checks.yml` (`pr-body`, `scripts`, `license-header`, `install-and-verify`), the Vercel build of `apps/client.app` if the user confirmed the project is connected to the repository and its ignored build step doesn't skip it, and the Docker images it affects, which nothing builds by itself;
- what the deploy will wait on and who does it, any item they waived, and the reminder of step 5 when it fired.

Then ask for the go-ahead to push the branch and open the PR ("Repo: davna"), and stop there.

### 9. After the user's yes

1. **Push the branch:** `git push -u origin <branch>`. The `pre-push` hook refuses only a push to `main`; if it refuses, the branch is wrong: stop and read why, never `--no-verify`.
2. **Open the PR:** `gh pr create --base main --head <branch> --title "<title>" --body-file <file>` (add `--draft` when the user wants it open before the review is complete). Give the user the PR's URL.
3. **Suggest the self-review:** `/code-review --comment` on the PR, which leaves its findings as review comments. Each comment is answered (a fix in a new commit, with its own yes, or an explanation) and resolved; a new commit that changes what an item checked updates that item in the body (`gh pr edit <n> --body-file <file>`, after `check-body`).
4. **Watch the checks:** `gh pr checks <n>`. The required ones (`pr-body`, `scripts`, `license-header`) must be green; `install-and-verify` is informative while it is not blocking (RG10).
5. **The merge waits for the user's explicit yes:** with the checks green and every conversation resolved, ask; after a yes, `gh pr merge <n> --merge`. Never `--admin`, never `--squash` or `--rebase`, never `--auto` unless the user asks.
6. **After the merge:** the main folder back on an updated `main` (`git switch main`, `git pull --ff-only origin main`); for a code branch, `node scripts/worktree.js remove <name>` (it deletes the local branch with `git branch -d`; if it refuses, stop and ask, never `-D`); for a `docs/<name>` branch, `git branch -d docs/<name>`. Then ask to delete the branch on `origin` with `git push origin --delete <branch>`, which is a push and needs its own yes.
7. **Follow the deploy,** when the change ships: walk the user through the manual steps of the go-live's "Ship" group in order (the images, the server's `docker compose -f docker-compose.prod.yml` update, a Vercel redeploy after a variable change), each with its expected output. The user runs them; you read what they share. Compare production with what the review expected (every container `healthy`, `/health` answering, the running image ids matching the tags in "Prepare", the last Vercel deploy green), with the reads of `.claude/skills/architecture-survey/references/survey.md`. A docs-only PR has nothing to compare.
8. **If production differs** (a container restarting, a deploy failed, something partial), tell the user what differs and propose the fix, on a new `fix/<name>` branch with its own PR.
9. **Report:** the PR and its state, the findings, the reminder of step 5, and what you could not verify, such as the server's state when the user didn't share it.
