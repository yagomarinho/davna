<!--
The title is a Conventional Commit (feat: ..., docs: accept stage 3 of
feature 004 (<name>)); the merge commit is the title plus (#<n>).

Fill every section as docs/process/pull-requests.md says, and check the body
with: node scripts/pr-review.js check-body <file>   (must print pr-review: ok)

Each ticked item gets its result on the same line, after an em dash:
  - [x] typecheck, tests, lint and build on the exact head — `yarn typecheck` green
A waived item stays unticked, with the user's note on the same line:
  - [ ] DNS and certificates — **Waived** on YYYY-MM-DD by the user: reason
A docs-only pull request keeps sections 1 and 7 and replaces the items of
sections 2 to 6 with one line each:
  Does not apply: docs-only pull request.

The self-review comes after the PR is opened (/code-review --comment): its
comments are answered or resolved before the merge, which the required
conversation resolution enforces. Editing this body re-runs the checks.
-->

<summary of the change in one or two sentences>

- **Advances:** <Feature NNN, stage N | Refactoring NNN | Improvement NNN | RGnn | fix: what it fixes | Production picture up to the short sha | Process: the doc's path> <Closes #n, when it closes an issue>

## 1. What the merge triggers

- [ ] the PR's files (`git diff --name-only origin/main...HEAD`) and the workflows and deploys they trigger
- [ ] the images that change and the containers they replace

## 2. The whole change, green

- [ ] the required checks of `checks.yml` green on the PR's head
- [ ] typecheck, tests, lint and build on the exact head
- [ ] the integration tests against the local stack
- [ ] the license header with no diff
- [ ] production now stable: the containers and the last client deploy

## 3. The limits of the hosts and providers

- [ ] the server: disk and memory
- [ ] MongoDB: storage and connections
- [ ] OpenAI: rate and spending limits
- [ ] the other quotas touched for the first time

## 4. The architecture rules

- [ ] the module boundaries and the direction of the shared packages
- [ ] the extension points: davna depends on no downstream project
- [ ] the data shape: additive, or the window
- [ ] logs and errors without content, personal data or secrets

## 5. Parameters, secrets and variables

- [ ] the server's .env, by name
- [ ] Vercel: the client's variables
- [ ] the registry: the push permission
- [ ] the providers' credentials, by name

## 6. What the deploy will wait on

- [ ] the manual steps right after the merge
- [ ] DNS and certificates
- [ ] third parties

## 7. The gates that already existed

- [ ] the production picture: merged PRs since its commit, and the glossary
- [ ] the images built, started and healthy, with their tags
- [ ] the "Prepare" group of the go-live
