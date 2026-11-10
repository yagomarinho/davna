# Pull requests

`main` changes **only by merging a pull request on GitHub**. Nothing is pushed to `main` directly, ever: not the specification, not the code, not a process doc, not a one-line fix. Every change goes up on its own branch, opens a pull request (PR), passes the required checks and the review recorded in the PR body, and is merged by the user with a merge commit.

`main` is what production is built from: the Docker images of the backend apps, the `apps/client.app` deploy and whatever pipeline a later change turns on all start from a commit of `main`. This repository's CI (`.github/workflows/checks.yml`) only checks conformance: the PR body, the repository scripts' specs, the license header, and the install, typecheck, tests and lint. It builds no image, needs no secret and deploys nothing. Production builds and deploys are done outside this repository's CI; today, by hand ([`docs/recommendations.md`](../recommendations.md), RG14). The review of section 3 still runs for every PR, so whoever deploys a commit of `main` finds it ready.

---

## 1. Why it exists

None of these problems is hard to find. They just were not on a list:

- **An image that cannot be built.** The Dockerfiles of `apps/monolith.api` and `apps/multimedia.processing` still name packages and paths that no longer exist (`apps/api`, `@davna/api`, `@davna/classroom`, `@davna/feedback`). A deploy that started from `main` would fail at the build, after the merge.
- **A moving tag.** `docker-compose.prod.yml` pulls `:latest`, so what runs in production is whatever was pushed last to the registry, not a commit of `main` ([image before go-live](../patterns/image-before-go-live.md)).
- **A red `main`.** `apps/monolith.api` imports packages that were removed, so `yarn typecheck` fails on `main` today; a PR that adds more red hides itself behind it.
- **Silent defaults.** Configuration falls back to development values when a variable is missing ([configuration](../patterns/configuration.md)), so a server without a variable starts and runs with the wrong value.

Each of these became an item of section 3. The PR is also the public history of the repository: what changed, why, what was checked and what was waived, in one place that anyone reading the project can open.

---

## 2. The flow

### 2.1. Branches

Every change has a short-lived branch named by its Conventional Commit type:

| Branch            | What goes on it                                                    | Where it lives                                                                         |
| ----------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `docs/<name>`     | specification (a stage acceptance), process, patterns, registers, the production picture | the main folder, created right before the commit; the main folder switches back to `main` right after the push |
| `feat/<name>`     | the tests and code of a feature or an improvement                  | a worktree outside every project tree (`yarn worktree new <name>`, [parallel features](parallel-features.md)) |
| `fix/<name>`      | a fix                                                              | a worktree (`--type fix`)                                                              |
| `refactor/<name>` | the code of a refactoring                                          | a worktree (`--type refactor`)                                                         |
| `chore/<name>`    | tooling, dependencies, CI                                          | a worktree (`--type chore`), or the main folder when it is only configuration text      |

The main folder rests on `main`. `<name>` is the change's slug (`docs/features/NNN.feature.<name>/` gives `feat/<name>`; a stage acceptance of that feature goes on `docs/<name>-stage-N`).

### 2.2. Every change is a PR, including the specification

- **A stage acceptance is a small docs PR.** Feature stages 1 to 8, a refactoring's stages, an improvement's definition: each acceptance is written in the stage document, committed on a `docs/` branch and merged by PR before the next stage starts from it ([feature stages](feature-stages.md)).
- **Code, tests, fixes and refactorings:** one PR per change, from its branch. A long change may open the PR as a draft early; it leaves draft when the review of section 3 is complete.
- **One PR advances one thing.** The body cites what it advances: `Feature NNN, stage N`, `Feature NNN` (the code), `Refactoring NNN`, `Improvement NNN`, `RGnn`, or the fix (`fix: <what>`). A PR that advances none of them cites what it changes instead: `Production picture up to <short sha>` for the `/architecture-survey` picture, and `Process: <doc>` for a process or pattern doc (`Process: docs/patterns/ci-triggers.md`); a register edit cites the item it adds or changes (`RGnn`). It may close a GitHub issue (`Closes #n`).

### 2.3. Title, body and merge

- **The title is a Conventional Commit** in English: `feat: <what>`, `fix: <what>`, `docs: accept stage 3 of feature 004 (<name>)`, `refactor: <what>`, `chore: <what>`.
- **The body** is `.github/pull_request_template.md`, filled: what the PR advances and the seven sections of section 3, every item resolved. `node scripts/pr-review.js check-body <file>` (or `yarn pr-review:check <file>`) validates it locally, and the `pr-body` job of `checks.yml` validates the body on GitHub.
- **The merge method is a merge commit,** never squash or rebase (the author's rule: sync by merge). The merge commit message is the PR title plus `(#<n>)` (repository setting, section 6). `git revert -m 1 <merge>` reverts a whole change at once.
- **The branch is up to date with `main` before the merge:** `origin/main` merged into the branch, by merge, never by rebase, as an authorized commit (`chore: sync <branch> with main`). The required checks are strict, so GitHub also refuses a PR behind `main`.

### 2.4. Authorization

Each of these needs its own clear yes from the user in the conversation, and none implies another:

- **each commit** (including the sync merge of `origin/main` into the branch);
- **pushing a branch and opening its PR** (`git push -u origin <branch>`, `gh pr create`);
- **merging the PR** (`gh pr merge <n> --merge`), which only the user's yes allows, never with `--admin`, and never by auto-merge unless the user asks for it;
- **deleting the branch on `origin`** after the merge (`git push origin --delete <branch>`).

Typing `/pull-request` authorizes only preparing the PR: the checks, the sweep and the body. It makes no commit and no push. `/architecture-survey` carries no authorization. Before each commit, push or merge, state the repository: "Repo: davna".

### 2.5. Self-review, visible

A solo maintainer cannot approve their own PR on GitHub, so required approvals are off (section 6). Instead, before the merge:

- the required checks are green (`pr-body`, `scripts`, `license-header`);
- the self-review is recorded in the PR: `/code-review --comment` on the PR leaves its findings as review comments, and each one is answered (fixed in a new commit, or explained) and resolved;
- every conversation is resolved (GitHub refuses the merge otherwise).

---

## 3. The review: what the PR body records

The PR body has the seven sections of `.github/pull_request_template.md`. Each item is the result checked, with the command and the output that proved it; or "does not apply", with the reason; or the user's waiver, as in the [gates](gates.md). An item without an answer blocks the PR.

- **Who:** the agent does the reads, only reads, in the repository, the local Docker stack and the local database. What only the user sees, the user confirms in the chat: the server, the image registry, the Vercel panel, the provider consoles (MongoDB host, AWS S3, Firebase, Google Cloud, OpenAI) and the DNS. A secret is never read: the check is by name, type, length or prefix ([production procedures](production-procedures.md)).
- **When:** after the last commit of the branch, before the PR is opened (or leaves draft). A new commit that changes what an item checked updates that item in the body.

Use `<base>` for `origin/main` after a `git fetch`, and `<tip>` for the branch's last commit. Run the commands in Git Bash or PowerShell.

### 3.1. What the merge triggers

- **The PR's files:** `git diff --name-only <base>...<tip>`.
- **The workflows:** `.github/workflows/checks.yml` runs on the PR and again on the merge into `main`; it only checks, and deploys nothing. Say which of its jobs the change touches ([pattern](../patterns/ci-triggers.md)).
- **The deploys outside the repository's CI:**
  - Vercel (`apps/client.app`): the user confirms whether the Vercel project is connected to the repository and builds on a merge into `main`, and its ignored build step, if any.
  - The Docker images (`apps/monolith.api`, `apps/multimedia.processing`, and `apps/interaction.conductor` when it has one): which ones this change affects, by the files each Dockerfile copies and builds. Nothing builds them automatically from this repository.
- **What the deploy replaces:** for each image that changes, the containers of `docker-compose.prod.yml` that will be recreated, and whether any volume or port changes.

### 3.2. The whole change, green

- **The checks, on the exact `<tip>`:** `yarn typecheck`; the tests of every workspace the change touches (`yarn test:modules`, `yarn workspace @davna/infra test`, `yarn workspace @davna/<app> test`); the lint (`yarn workspace @davna/client-app lint`, and ESLint with the root `eslint.config.mjs` on the touched packages; there is no root `lint` script yet); the build of each app it changes (`yarn workspace @davna/<app> build`); and `yarn test:scripts`. A check already red on `<base>` is written with its cause and the register item that tracks it ([`docs/recommendations.md`](../recommendations.md)); for `yarn typecheck`, compare `yarn typecheck:only-files` on `<base>` and `<tip>`: the change adds no file with errors, and only the user waives the rest ([gates](gates.md); on Windows, run it from Git Bash, RG17). The `install-and-verify` job of `checks.yml` runs the same checks on GitHub, not blocking while they are red today (RG10).
- **Integration tests** that need MongoDB and the root `.env`: run against the local Docker stack (`yarn api:up`), or say why not.
- **The license header:** `yarn add:header` changes nothing (`git status` clean afterwards); the `license-header` job checks the same.
- **Production now is stable:** the user confirms that the containers of `docker-compose.prod.yml` are up and healthy (`/health` of each app) and that the last `client.app` deploy is green, or says what is red and why.

### 3.3. The limits of the hosts and providers

- **The server:** free disk for the new images (they are pulled before the old ones are removed) and memory for the containers.
- **MongoDB:** the storage and connection limits of the plan, when the change adds collections, indexes or GridFS volume.
- **OpenAI:** the rate and spending limits of the key, when the change alters what is sent to the model or how often.
- **Vercel, AWS S3, Firebase and Google Sheets:** any quota touched for the first time (a new bucket, a new spreadsheet, a new function), checked by the user in the console.

### 3.4. The architecture rules

- **The module boundaries:** no module imports another module (`modules/*` depend only on `shared/*`); apps compose modules; `shared/kernel`, `shared/core`, `shared/application` and `shared/infra` keep their direction. A module that starts writing another module's concept, or a call that crosses a boundary, is a finding and goes to the user before the PR.
- **Extension points:** projects that build on davna consume its exported packages and ports; davna never depends on them. A change that only makes sense for one downstream project is a finding.
- **The data shape:** a change to a collection, an entity version or an index says whether it is additive. One that is not additive breaks the code in production until the new code runs: write the window agreed with the user ([go-live](go-live.md)).
- **Logs and errors:** no message content, personal data or secret goes into a log, an error or a response.

### 3.5. Parameters, secrets and variables

Check only names, types and length, never the value.

- **The server's `.env`:** every variable the change adds or renames in `.env.example` exists on the server, by name. The user confirms.
- **Vercel:** every new or changed variable of `apps/client.app/.env.example` (`API_*`, `NEXT_PUBLIC_*`) is in the project's panel, in the right environment. The user confirms. A `NEXT_PUBLIC_*` value goes to the browser: never a secret.
- **The registry:** the account that pushes the images can push to the repository the compose pulls. The user confirms.
- **The providers' credentials** (Firebase Admin, Google Cloud service account, AWS S3, OpenAI) that the change starts to need exist, by name.
- **The CI:** `checks.yml` uses no secret; a change that would make it need one is a finding.

### 3.6. What the deploy will wait on

- **The manual steps right after the merge:** building and pushing the images, pulling them on the server and recreating the containers (`docker compose -f docker-compose.prod.yml ...`, run by the user), a Vercel redeploy after a variable change, in order and with who does each one, taken from the "Ship" group of the go-live.
- **DNS and certificates:** a new domain or subdomain and who creates it.
- **Third parties:** anything a provider must approve or enable before the change works.

### 3.7. The gates that already existed

- **The production picture** (`docs/system/`) is not redone at every PR: count the PRs merged into `main` after the commit that the header of `docs/system/overview.md` names (`git log --merges --first-parent --oneline <sha>..origin/main`). With 5 or more, the picture fell behind, and `/pull-request` suggests `/architecture-survey` to the user after the merge; a missing `docs/system/overview.md` also. The threshold is a proposal the user adjusts, here and in the skill. The terms the change brings already go into the glossary (`docs/system/language.md`) in this PR.
- **The images** built from `<tip>`, started and healthy before the go-live, with their tags written in the go-live's "Prepare" group, when the change touches a backend app ([image before go-live](../patterns/image-before-go-live.md)).
- **The "Prepare" group of the go-live:** no open item, and the user's decisions and the reviews that the merge requires, done or waived.

### 3.8. Docs-only PR

When every file of the PR is documentation (`docs/**`, `**/*.md`, `.claude/**`) and nothing builds from it, the review has only section 3.1, which proves nothing deploys, and 3.7. The other sections say "does not apply: docs-only PR". A stage acceptance is the common case.

### 3.9. How an item is written

Each ticked item gets its result on the same line, after an em dash (`—`); `check-body` refuses a ticked item without it. A waived item stays unticked, with the **Waived** note of the [gates](gates.md) on the same line:

```markdown
- [x] typecheck, tests, lint and build on the exact tip — `yarn typecheck` adds no file with errors (RG01, RG02 waived); `yarn test:modules` 5/5 green; `yarn workspace @davna/monolith.api build` green
- [x] OpenAI: rate and spending limits — does not apply, the change does not alter what is sent to the model
- [ ] DNS and certificates — **Waived** on 2026-11-12 by the user: no domain changes in this PR
```

---

## 4. The checks and the guards

- **`node scripts/pr-review.js check-body <file|->`** validates a PR body: the sections `## 1.` to `## 7.` present and not empty, every ticked item with " — " and its result, every unticked item with the full **Waived** note (`**Waived** on YYYY-MM-DD by the user: reason`), and the line citing what the PR advances. It reads every task list item GitHub renders: `- [ ]`, `* [ ]`, `+ [ ]` and `1. [ ]`. It prints `pr-review: ok` or the problems, with exit 0 or 1. `yarn pr-review:check <file>` runs the same.
- **`.github/workflows/checks.yml`** runs on every PR to `main` and on every push to `main` (the merges), with `contents: read` permission and no secret:
  - `pr-body` (PRs only): writes the PR body to a file through an environment variable, never interpolated into the shell, and runs `check-body` on it with the rule from `main` (it checks out the PR's base commit), so a PR cannot loosen the check that judges it: a PR that changes `scripts/pr-review.js` is judged by the rule already merged. Only while `main` has no `scripts/pr-review.js` yet (the PR that brings this flow) does the PR's own rule judge it, with a notice in the run;
  - `scripts`: `node --test scripts/__tests__/*.spec.js`;
  - `license-header`: `node scripts/add.header.js`, then `git diff --exit-code`;
  - `install-and-verify`: `yarn install --frozen-lockfile`, then the typecheck, `yarn test:modules` and the lint, not blocking (`continue-on-error`) while the code is red today (RG01 to RG03); making it blocking is RG10.
- **The `pre-push` hook** (`.githooks/pre-push`, which runs `node scripts/pr-review.js pre-push`) refuses any push whose remote ref is `refs/heads/main`, and the deletion of `main`, with the message "main only changes by merging a pull request". Every other branch goes up freely.
- **The hook is enabled once per clone:** `yarn install` enables it (the `prepare` script, `scripts/hooks.js`, sets `core.hooksPath` to `.githooks`); without an install, the user runs `git config core.hooksPath .githooks` once. Every worktree shares it. The hook is LF (`.gitattributes`) and is committed executable (`git add --chmod=+x .githooks/pre-push`, which the user runs): git ignores a hook without the executable bit on Linux and macOS without a word.
- **`git push --no-verify`** skips the hook, and so it is never used.
- **The checks do not replace the review.** They only guarantee that the record exists and is complete. A body ticked without the reads is the failure this process exists to prevent.

---

## 5. Cross-repository order

davna depends on no other repository, so a davna PR never waits for one. When a project that builds on davna needs a change here, the change is a davna feature, refactoring, improvement or fix written on davna's own terms, with its own PR, checks and merge into `main`; the other project only consumes a commit already on davna's `main`.

---

## 6. Repository settings

The user applies these once, in the GitHub panel or with the prepared commands below (run from a clone of this repository, with `gh` authenticated; `{owner}` and `{repo}` are filled by `gh` from the clone's remote). This repository is public, so the ruleset is free. **Not exercised:** check each output against the expected one before relying on it.

1. **Merge methods:** only merge commits; the merge commit title is the PR title (GitHub appends `(#<n>)`) and its message is the PR body.

   ```bash
   gh api -X PATCH repos/{owner}/{repo} \
     -F allow_merge_commit=true -F allow_squash_merge=false -F allow_rebase_merge=false \
     -f merge_commit_title=PR_TITLE -f merge_commit_message=PR_BODY
   ```

   Expected: a JSON with `"allow_merge_commit": true`, `"allow_squash_merge": false`, `"allow_rebase_merge": false`, `"merge_commit_title": "PR_TITLE"`.

2. **A ruleset on `main`:** require a PR (no required approvals, conversations resolved, merge commit only), require the status checks `pr-body`, `scripts` and `license-header` with the branch up to date, block force pushes and deletion, with no bypass actors. Save this as `ruleset.json` outside the repository:

   ```json
   {
     "name": "main",
     "target": "branch",
     "enforcement": "active",
     "conditions": {
       "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] }
     },
     "rules": [
       { "type": "deletion" },
       { "type": "non_fast_forward" },
       {
         "type": "pull_request",
         "parameters": {
           "required_approving_review_count": 0,
           "dismiss_stale_reviews_on_push": false,
           "require_code_owner_review": false,
           "require_last_push_approval": false,
           "required_review_thread_resolution": true,
           "allowed_merge_methods": ["merge"]
         }
       },
       {
         "type": "required_status_checks",
         "parameters": {
           "strict_required_status_checks_policy": true,
           "required_status_checks": [
             { "context": "pr-body" },
             { "context": "scripts" },
             { "context": "license-header" }
           ]
         }
       }
     ]
   }
   ```

   ```bash
   gh api -X POST repos/{owner}/{repo}/rulesets --input ruleset.json
   gh api repos/{owner}/{repo}/rulesets
   ```

   Expected: the first returns the ruleset with an `id` and `"enforcement": "active"`; the second lists it by name. The check names must match the names the jobs report on a PR's "Checks" tab; a required check that never reports blocks every merge, so run one PR through `checks.yml` before creating the ruleset.

3. **Check it:** `gh api repos/{owner}/{repo}/rules/branches/main` lists the rules above (`deletion`, `non_fast_forward`, `pull_request`, `required_status_checks`), and a test PR shows the three required checks and the merge button offering only "Create a merge commit".

---

## 7. The choices of this process

Decided by the user on 2026-11-10:

- **`main` changes only by merging a PR,** for every kind of change, including the specification. Discarded: a direct push to `main` with a review record committed in `docs/`, because the PR is the market-standard flow, keeps the history public in one place and lets GitHub enforce the checks.
- **Merge commits only;** sync by merge, never rebase or squash.
- **No required approvals** (a solo maintainer); the self-review is recorded in the PR instead.
- **This repository's CI only checks conformance.** It builds and deploys nothing and uses no secret.

---

The other processes: [Feature stages](feature-stages.md), [Findings and decisions](findings-and-decisions.md), [Gates](gates.md), [Production procedures](production-procedures.md), [Go-live](go-live.md), [Feature closing](feature-closing.md), [Parallel features](parallel-features.md), [Refactorings](refactoring.md) and [Improvements](improvements.md).
