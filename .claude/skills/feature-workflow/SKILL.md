---
name: feature-workflow
description: Applies this repo's feature processes (docs/process/) to any work that moves a feature in docs/features/ forward. Use it whenever the user asks to open a new feature, to write, review or accept a stage (stage 1 to stage 9 - definition, flows, use cases, modules, contracts, data model, architecture, test checklist, implementation checklist), to start the tests or the code of a feature, to commit feature work, open its pull request or merge it, to deploy or turn something on in production (go-live, procedure, "ship it", "turn it on"), to give or update the production task list ("the list", "only what is pending"), or asks what comes next in a feature. Also use it right after a merge, a deploy or a stage acceptance, to sweep the docs for stale state, even if the user doesn't mention the process.
---

# Feature workflow

This skill applies the feature processes. The processes themselves live in `docs/process/`, one document each, written for people; this file only says how to apply them. Read the one that matches the work before acting:

| Process                                    | Document                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| The nine stages, their rules, TDD          | `docs/process/feature-stages.md`                                           |
| Where findings and decisions are recorded  | `docs/process/findings-and-decisions.md`                                   |
| The gates and the waivers                  | `docs/process/gates.md`                                                    |
| Writing and running a step in production   | `docs/process/production-procedures.md`                                    |
| Pull requests, the only way into `main`    | `docs/process/pull-requests.md`, applied by the `pull-request` skill       |
| The deploy and turning the feature on      | `docs/process/go-live.md`                                                  |
| What comes after the go-live               | `docs/process/feature-closing.md`                                          |
| Worktrees, branches and the merge queue    | `docs/process/parallel-features.md`                                        |
| Refactorings, which keep the behavior      | `docs/process/refactoring.md`, applied by the `refactoring-workflow` skill |
| Improvements, an earlier spec in a new app | `docs/process/improvements.md`                                             |
| The reusable solutions                     | `docs/patterns/README.md` and the patterns it lists                        |

When a process document and this skill disagree, the document wins, and the user's explicit word wins over both.

The repo's rules in `CLAUDE.md` still hold and are not repeated here: each commit, each push of a branch with its pull request, and each merge only with explicit authorization, each time, stating the repository ("Repo: davna"); `main` changes only by merging a pull request; Conventional Commits in English; no inline configuration ([configuration](../../../docs/patterns/configuration.md)); business rules in the domain ([business rules](../../../docs/patterns/business-rules.md)); the MIT license header on every new `src/**/*.ts` (`yarn add:header`).

## 1. Start by locating the feature and its state

Before doing anything for a feature, find out where it stands, because the right next step depends on it and the conversation alone is not a reliable record (it gets summarized, and new sessions start empty).

1. **The repository.** `git rev-parse --show-toplevel`: its basename is `davna`. Everything this skill reads and writes is inside this repository.
2. **The checkout.** `git branch --show-current` and `node scripts/worktree.js list` (or `git worktree list`). The main folder rests on `main`, leaving it only for a short-lived `docs/<name>` branch that goes back to `main` right after its push; a feature's tests and code live in its worktree outside the project tree, `$WORKTREES_ROOT/davna/<name>`, on `feat/<name>`, and a parallel session's on its own `claude/<session>` branch (`docs/process/parallel-features.md`, sections 2 and 9). Write nothing for a feature from the wrong folder, and in a parallel session keep to the files and the id ranges your briefing gives.
3. **The folder:** `docs/features/NNN.feature.<name>/`, and its row in the index of `docs/features/README.md`. A feature that has no folder yet is opened by section 8.
4. **The accepted stages:** each stage records its acceptance, with a date (search the stage files for "Accepted by the user" and "Approved by the user"). The production picture, up to the commit its header names, is in `docs/system/overview.md` (the pull requests merged after it are `git log --merges --first-parent --oneline <sha>..origin/main`); before the first `/architecture-survey`, `docs/system/` holds only its README. The `CLAUDE.md` files hold no feature state.
5. **The open items:**
   - the unchecked boxes and the waivers in `8.tests.checklist.md` and `9.implementation.checklist.md`;
   - the go-live list, when there is one (a section of the stage 9 checklist);
   - the index of `recommendations.md` (open items whose trigger has arrived);
   - the index of `agent.decisions.md` (decisions pending review);
   - the items of `docs/recommendations.md` (`RGnn`) the feature took, or whose trigger this feature brings.

Say the state in two or three lines before proposing work: the last accepted stage, what is in progress, and what waits on the user.

## 2. Gates

A gate is a point where work only goes on once its pending items are resolved. The gates are in `docs/process/gates.md`, section 1. Apply them like this:

- **Don't skip a gate on your own.** If a request would cross one (tests before stage 8 is approved, code before a failing test, a stage before the previous one is accepted, a merge with open decisions), say which gate and what is pending, and ask.
- **Each pending item leaves the list only as done or waived.** If the user goes ahead anyway, that is a waiver: write it in the checklist, with the date, who decided and why (format in `docs/process/gates.md`, section 3: "**Waived** on YYYY-MM-DD by the user: the reason."). The item stays unchecked, so it stays visible.
- **The red baseline.** While `docs/recommendations.md` RG01 to RG03 keep `yarn typecheck` red on `main`, the merge gate compares `yarn typecheck:only-files` before and after the change: the change adds no file with errors, and the rest is waived item by item, citing those items (`docs/process/gates.md`, section 1).
- **`main` changes only by a pull request, `/pull-request`.** Every change reaches `main` by a PR merged on GitHub: a stage acceptance, the feature's code, a fix, a docs-only change. Before opening one, ask the user to run `/pull-request`: it checks the branch, runs the local checks, sweeps the docs and ticks the go-live, brings the feature's terms to the glossary, fills the PR body from `.github/pull_request_template.md` with the review of `docs/process/pull-requests.md`, section 3, checks it with `node scripts/pr-review.js check-body`, and asks to push the branch and open the PR. Only the user can run it, so don't try. The `pre-push` hook refuses any push to `main` (`docs/process/pull-requests.md`, section 4), `--no-verify` is forbidden, and the review has no waiver as a whole, only item by item, by the user. The merge waits for the user's own yes.
- **The production picture, on demand.** `docs/system/` is not refreshed per feature: `/architecture-survey` does it when the user asks, or when `/pull-request` says the picture is behind (`docs/process/go-live.md`, section 2). Only the user can run it; suggest it when either happens.
- **At the merge and go-live gates, list the pending decisions** (`docs/process/gates.md`, section 2): the open register items whose trigger has arrived (the feature's and `docs/recommendations.md`), the agent decisions pending review, and the open decisions a stage left (like the final open-points section of stage 8). Give a short count and the ids, not the full text.
- **One change with code at a time.** Another feature, refactoring or improvement with code only merges into `main` after this one ends its "Turn on" group (`docs/process/parallel-features.md`, section 6).

## 3. Discussion is not an order to edit

When the user opens with a question, a doubt or a request for suggestions ("it's a question", "let's discuss", "make suggestions", "don't create anything"), answer with the analysis and a recommendation, and touch no file until they say to apply it. A short "let's try X" is a direction, not an order to build tooling: give the plan in a line or two and ask before creating files.

Keep to what was asked. If you see something worth adding (an extra data change, a new document, a refactor), propose it instead of bundling it into the change.

## 4. Where findings and decisions go

The table is in `docs/process/findings-and-decisions.md`, section 1.

- **A gap or an idea** found while reviewing or implementing goes to the feature's `recommendations.md` as a new item (section 2 of that document), not into the stages or into the scope.
- **A choice you make alone** because the docs and tests don't settle it goes to `agent.decisions.md`, pending review (section 3). Check the sources in the order that file gives before deciding; what they already define is not your decision.
- **A finding that outlives the feature,** or belongs to no open change, goes to `docs/recommendations.md` as an `RGnn` item, written from the main folder on a `docs/<name>` branch and merged by pull request (section 4).
- **A user decision** goes where it applies (the stage, the checklist or the item it answers), with the date.
- **A solution the repository will reuse** goes to `docs/patterns/` (`docs/patterns/README.md`, "How to record a pattern").
- Ids are never reused, and items are never deleted (section 5).

## 5. Sweep the docs at every transition

A state change makes words in the docs false: "on the branch", "not deployed", "future", "pending", "not yet". Stale lines are found by hand at the end unless someone looks at each transition. Right after a stage acceptance, a merge, a deploy or a go-live step, search for them and propose the fixes (`docs/process/feature-closing.md`, section 1):

```bash
git grep -n -i -E "feat/|refactor/|on the branch|in the worktree|not deployed|isn't deployed|not implemented|not applied|not yet|in the future|under review" -- "*.md"
```

Add the feature's own words (its slug, the names it replaces). Read each hit in context: many are correct (an item really still pending). Update only what the transition made false, and give the date of the new state.

## 6. Production procedures

Every step you write for production (a manual procedure, the go-live, a one-off fix) follows `docs/process/production-procedures.md`: the expected output next to the command, how long to wait when the change isn't immediate, the effect of the step, and the "Not exercised" mark until it has run once (section 1). Two things matter most:

- **The user writes to production and handles secrets** (sections 2 and 3). You prepare the command and check the result through the logs (`docker compose logs`), the `/health` endpoints, the metrics and the metadata. Never read a secret's value and never open a `.env` file, even when the session's credentials would allow it; keep values in the user's shell variables, checked by name, length, prefix or `true`.
- **A procedure is a hypothesis until it runs.** Before writing one, think about how the service really behaves: what the step counts, what it stops besides the target, how long it takes to apply. A bulk change in MongoDB runs its filter with `countDocuments` first, with a `mongodump` of the affected collections before it (section 2).

Assumptions about third parties (how OpenAI answers a given input, how Firebase reports an expired token, how fast a Vercel variable applies) are assumptions, not facts of the plan (section 4). Write each one with the way to check it, and record the result once checked.

When a feature ships something production runs (a Docker image) or a provider reads, plan a cheap check of the real artifact before it reaches production: build the image from the change's commit and start it against a test environment until `/health` answers ([image before go-live](../../../docs/patterns/image-before-go-live.md)); pin every external tool and base image by version; and keep the provider's own configuration (the Vercel project, the Firebase project, the bucket) written down as the spec, checked after each change.

## 7. The task list

When the user asks for the production list, or for "only what is pending", show only the pending items, grouped as Prepare, Ship, Turn on and After (`docs/process/go-live.md`, section 1). Each item is one line, with who runs it when it isn't obvious. Done items, explanations and history stay out of the list; they belong in the checklist.

Keep the list in the stage 9 checklist, not only in the conversation: update the document when an item is done (with the date), and build the answer from it.

## 8. Opening a feature and its next stage

Features are opened from this skill's English templates in [templates/](templates/): `1.feature.definition.md`, `2.system.flow.md`, `3.use.cases.md`, `4.modules.definition.md`, `5.system.contracts.md`, `6.data.model.md`, `7.architecture.definition.md`, `8.tests.checklist.md`, `9.implementation.checklist.md`, `agent.decisions.md` and `recommendations.md`. Their placeholders are `__TITLE__` (the feature's title, in English), `__NNN__` (its three-digit number) and `__P__` (its id prefix); what each id looks like, prefixed or not, is in [templates/README.md](templates/README.md). Features are opened only from these templates; templates from any other source are not used in this repository.

### Opening a feature

1. **Read the ground.** `docs/process/feature-stages.md`, `docs/process/findings-and-decisions.md` and `docs/process/gates.md`; the index of `docs/features/README.md`; the last accepted stage of each open feature (section 1). A new specification may start while another change is being coded; it says on what it builds (`docs/process/feature-stages.md`, section 3). Check it is a feature and not a refactoring or an improvement (`docs/process/refactoring.md`, section 1; `docs/process/improvements.md`, section 1).
2. **The checkout.** The main folder: stages 1 to 7, and stage 8 until it is approved, are written there, on a short-lived `docs/<name>` branch cut from an up-to-date `main` and merged by pull request (`docs/process/parallel-features.md`, section 2; `docs/process/pull-requests.md`, section 2).
3. **Number, name and prefix** (`docs/features/README.md`, "Naming"). `NNN` is the next number of the features' own sequence (`ls docs/features/`), never reused. `<name>` is a short English slug with hyphens. The prefix is empty in the first feature; from the second on, it is one capital letter that hints at the feature, different from every prefix in the indexes of `docs/features/README.md`, `docs/refactorings/README.md` and `docs/improvements/README.md`, and never `G` (reserved for `docs/recommendations.md`; `docs/process/findings-and-decisions.md`, section 4). List the prefixes already used:

   ```bash
   git grep -h -o -E "\bUC-[A-Z]*[0-9]{2}\b" -- docs/features | sed -E 's/[0-9]+$//' | sort -u
   ```

4. **Agree before writing.** Confirm with the user, in one short message: the title (`__TITLE__`), the folder name and the prefix. The prefix is recorded as the last decision of stage 1.
5. **Create the folder** with three files only, replace every placeholder and check none is left:

   ```bash
   dest=docs/features/NNN.feature.<name>
   mkdir -p "$dest"
   for f in 1.feature.definition.md recommendations.md agent.decisions.md; do
     cp ".claude/skills/feature-workflow/templates/$f" "$dest/$f"
   done
   sed -i -e "s/__TITLE__/<Title>/g" -e "s/__NNN__/NNN/g" -e "s/__P__/<P>/g" "$dest"/*.md
   grep -rn "__[A-Z]*__" "$dest"
   ```

   The last command must print nothing.

6. **Write stage 1 with the user, not for them.** Ask what the conversation hasn't said: the goal, the problem, who uses it, what stays out, which personal data it stores, the new or changed terms ([ubiquitous language](../../../docs/patterns/ubiquitous-language.md), "The life of a term"), and the `RGnn` items it takes (`docs/process/feature-stages.md`, section 2). Don't invent business rules: write the ones the user gave, and turn every gap into an open decision, with a recommendation. A need that comes from a project building on davna is written as a generic extension point, port or contract, on davna's own terms (`docs/process/feature-stages.md`, section 3).
7. **The index row.** Add the feature's row (number, folder, prefix, state) to the index of `docs/features/README.md`. Each `RGnn` item the feature takes gets the status "taken" in `docs/recommendations.md`, with the date and the folder (`docs/process/findings-and-decisions.md`, section 4).
8. **Report and ask for the commit:** the folder created, the open decisions with their recommendations, and what stage 1 needs to be accepted. The commit is `docs: open feature NNN (<name>)`, on the `docs/<name>` branch in the main folder, with the user's authorization ("Repo: davna"); then `/pull-request` prepares its pull request.

### Opening the next stage

1. **Gate: the previous stage is accepted,** with the acceptance written in it (`docs/process/gates.md`, section 1). If not, say which stage and what is pending, and ask. If the user goes on anyway, write the waiver in the stage.
2. **Copy the template** of stage N from `.claude/skills/feature-workflow/templates/` into the feature's folder, replace the placeholders and check with `grep -rn "__[A-Z]*__"` that none is left. Delete the sections that don't apply (a feature with no data change keeps stage 6 short and says so), and remove each template comment as its section is written.
3. **Stage 8 opens** only after stages 1 to 7 are accepted; **stage 9** only after stage 8 is approved and the decisions taken while writing the tests are confirmed. Stage 8 is approved by a docs pull request merged into `main`; the `feat/<name>` branch and its worktree are created right before the first test (`references/delivery.md`).
4. **The acceptance.** When the user accepts a stage, record it in the stage ("**Accepted by the user on YYYY-MM-DD.**", stage 8 "**Approved**", and what the answers changed), apply the adjustments to earlier stages as dated notes, never by rewriting them, and run the sweep of section 5. The commit is `docs: accept stage N of feature NNN (<name>)`, on a `docs/<name>-stage-N` branch, with the user's authorization; the pull request, with the same title, is prepared by `/pull-request`, and the next stage starts from `main` once it is merged.

What each stage holds and what to check before asking for acceptance is in `references/spec-stages.md`.

## 9. References

Read the one that matches the phase you are in:

- `references/spec-stages.md`: stages 1 to 7. What each stage delivers and what to check before calling it ready for acceptance.
- `references/delivery.md`: stages 8 and 9. The branch and its worktree, the test checklist, TDD during implementation, agent decisions, and what to run before a commit.
- `references/go-live.md`: the pull request and its merge, the deploy and the go-live. The list template, the procedure template, the secrets protocol, how to diagnose a request or a message that doesn't arrive, and the cautions for davna's deploy.
