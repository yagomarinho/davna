---
name: refactoring-workflow
description: Applies this repo's refactoring process (docs/process/refactoring.md) to any change of structure, names or organization that keeps the system's behavior - renaming a concept across code, MongoDB collections and docs (the ubiquitous language), moving code between packages, breaking a dependency cycle, splitting a package, swapping a pattern, reshaping documents. Use it whenever the user asks to refactor ("refactoring", "refactor", "rename across the code", "apply the ubiquitous language", "rename X to Y", "move to another package", "clean up the legacy", "fix the package name"), to open a refactoring or write, review or accept its definition, plan, safety net or implementation checklist, to change code for a refactoring, or to commit one, open its pull request, merge or deploy it. Also use it when a register item that renames or restructures (an RGnn of docs/recommendations.md, or an item of a feature's register) is about to start, and right after a refactoring's stage acceptance, merge or deploy, to sweep the docs.
argument-hint: '[refactoring name or folder, e.g. 001.refactoring.name]'
---

# Refactoring workflow

This skill applies `docs/process/refactoring.md`, written for people; this file only says how to apply it. A refactoring follows the feature processes in everything else (the gates, the registers, the production procedures, the go-live, the closing, the parallel work), so read the refactoring process first, and the feature ones it cites when the work reaches them. When a process document and this skill disagree, the document wins, and the user's explicit word wins over both.

The repo's rules in `CLAUDE.md` hold as always: each commit, each push of a branch with its pull request, and each merge only with explicit authorization, each time, stating "Repo: davna"; `main` changes only by merging a pull request; no configuration value inline in the code; business rules in the domain; the MIT license header on every `src/**/*.ts`.

## 1. Is it a refactoring?

Before anything, check that the change keeps the behavior (`docs/process/refactoring.md`, section 1): what the user sees, the business rules, the public contracts (including the extension points that projects building on davna consume) and what the system stores stay the same. If the change alters any of them, say so: it is a feature (the `feature-workflow` skill), an improvement or a fix. If it's unclear, ask.

Then size it (section 2). A **small refactoring** (one package; no data, contract, configuration or production change; no glossary term) needs no folder: say the plan in two lines, wait for the user's agreement, keep the tests green before and after, and ask for the commit, on a `refactor/<name>` branch whose pull request `/pull-request` prepares. Anything bigger gets the folder.

## 2. Locate the refactoring and its state

The conversation alone is not a reliable record (it gets summarized, and new sessions start empty), so read the repo:

1. **The checkout:** `git branch --show-current` and `node scripts/worktree.js list`. The main folder rests on `main` (leaving it only for a short-lived `docs/<name>` branch); the refactoring's code lives on `refactor/<name>`, in its worktree outside the project tree (`$WORKTREES_ROOT/davna/<name>`).
2. **The folder:** `docs/refactorings/NNN.refactoring.<name>/`.
3. **The accepted stages,** each with its acceptance date (search the documents for "Accepted by the user" and "Approved by the user").
4. **The open items:** the unchecked boxes and the waivers in the two checklists, the go-live list, the open items of `recommendations.md` whose trigger has arrived, the items of `docs/recommendations.md` the refactoring took, and the decisions of `agent.decisions.md` pending review.

Say the state in two or three lines before proposing work: the last accepted stage, what is in progress, and what waits on the user.

## 3. Opening a refactoring

When the user asks for a new one:

1. Take the next number in `docs/refactorings/` (the first is `001`) and a short English kebab-case name.
2. Create the folder with `1.refactoring.definition.md`, `recommendations.md` and `agent.decisions.md` from `templates/`, replacing the placeholders (`{{NNN}}`, `{{TITLE}}`, `{{NAME}}`, `{{P}}`), and check none is left (`grep -rn "{{" docs/refactorings/NNN.refactoring.<name>/`). The later documents are created one at a time, when their stage starts.
3. Propose the id prefix in the definition: a letter or two that no feature, no other refactoring and no improvement uses (check the indexes in `docs/features/README.md`, `docs/refactorings/README.md` and `docs/improvements/README.md`, and the definitions), and never `G`, which is reserved for `docs/recommendations.md`. The user decides it with the definition.
4. If the refactoring takes items of `docs/recommendations.md` (`RGnn`), the definition cites them, and each item gets the status "taken" with the date and the folder (`docs/process/findings-and-decisions.md`, section 4). That register is written only from the main folder, on a `docs/<name>` branch merged by pull request.
5. Add the refactoring's row to the index of `docs/refactorings/README.md`.

## 4. The stages

Read `references/stages.md` for what each document contains and what to check before asking for acceptance.

| Stage          | Document                        | What the user accepts                                     |
| -------------- | ------------------------------- | --------------------------------------------------------- |
| 1. Definition  | `1.refactoring.definition.md`   | the reason, the invariants, the scope and the terms       |
| 2. Plan        | `2.refactoring.plan.md`         | the inventory, the steps, the deploy and the way back     |
| 3. Safety net  | `3.tests.checklist.md`          | the tests that pin today's behavior                       |
| 4. Execution   | `4.implementation.checklist.md` | the go-live list, when the refactoring reaches production |

- **Don't skip a gate on your own.** Each stage starts from the previous one, accepted, with the acceptance written in it. If the user goes ahead anyway, record the waiver (`docs/process/gates.md`, section 3).
- **Discussion is not an order to edit.** A question, a doubt or a request for suggestions gets the analysis and a recommendation; touch no file until the user says to apply it.
- **Keep to what was asked.** Something worth adding goes to the user as a proposal, or to `recommendations.md`, never into the scope.

## 5. The safety net comes first

Read `references/execution.md` before the first change. The rules that matter most:

- **No change without a green net.** Before touching code, the affected behavior is covered by passing tests. A gap gets a characterization test first, green against today's code. One that fails against today's code found a defect: it becomes a separate fix. Packages without tests today (`shared/core`, `shared/application`, `shared/kernel`, `services/ffmpeg`) need their net before any refactoring touches them.
- **Each step ends green.** A step that turns a test red is undone or fixed before the next one.
- **Tests change only mechanically:** the name, path, import or identifier the refactoring renames. An assertion that must change means the behavior changes: stop and ask.
- **Never weaken a test** to make it pass.

## 6. Names: the ubiquitous language

A refactoring that renames follows `docs/patterns/ubiquitous-language.md`:

- **The new names come from the user,** in the definition's term table. Never invent one; propose and ask.
- **The inventory finds every occurrence:** code (types, entity tags `_t`, `EntityURItoKind` entries, package and folder names), MongoDB (collections, fields, index names, validators), environment variable names, contracts (DTOs, routes, socket events, handlers, ports), Dockerfiles and compose files, docs and the diagrams in `docs/project/`. Use `git grep -n -w` for the repo and the read-only `mongosh` queries of `references/execution.md` (and the catalog queries of the `architecture-survey` skill, `references/survey.md`) against the local Mongo for the data, and write the commands in the plan.
- **A rename that must wait** gets a register item with a trigger, and the glossary marks the legacy name.

## 7. Where findings and decisions go

As in a feature (`docs/process/findings-and-decisions.md`): a gap or an idea goes to the refactoring's `recommendations.md`; one that outlives the refactoring goes to `docs/recommendations.md`, from the main folder; a choice you make alone, because the documents and tests don't settle it, goes to its `agent.decisions.md`, pending review; a user decision goes where it applies, with the date. Ids are never reused, and items are never deleted.

## 8. Branch, merge, deploy

- **Specification by docs pull requests, code on a branch.** Until the safety net is approved, each document's acceptance is a small docs pull request from a `docs/<name>` branch in the main folder (`docs/process/pull-requests.md`, section 2). Then, with `main` updated, the main-folder session creates the branch and its worktree outside the project tree: `node scripts/worktree.js new <name> --type refactor` (branch `refactor/<name>` from `main`, worktree at `$WORKTREES_ROOT/davna/<name>`; it fails if `WORKTREES_ROOT` is unset or inside a project tree, and lists the `.env*` files the user may copy, never copying them). From then on, the refactoring's folder only changes on that branch. Everything in `docs/process/parallel-features.md` applies with `refactor/` in place of `feat/`.
- **One change with code at a time** per repository reaches production: a refactoring takes its turn in the queue like a feature.
- **Every merge is authorized.** The sync of `origin/main` into the branch is an authorized commit, `chore: sync refactor/<name> with main`, naming the folder and both branches; sync by merge, never rebase. The merge into `main` is the pull request's merge commit on GitHub (`gh pr merge <n> --merge`, title `refactor: <what>` citing Refactoring NNN), only with the user's yes.
- **Before the pull request,** ask the user to run `/pull-request` with the refactoring's folder. Only the user can run it. It checks the branch, runs the local checks, sweeps the docs and ticks the go-live, brings the refactoring's terms and legacy names to the glossary (`docs/system/language.md`), fills the PR body with the review of `docs/process/pull-requests.md`, section 3, checks it with `node scripts/pr-review.js check-body`, and asks to push the branch and open the PR. Typing `/pull-request` authorizes no commit and no push; each waits for its own yes, and so does the merge. Every change to `main` goes through a pull request, and the `pre-push` hook refuses any push to `main` (`--no-verify` is forbidden). The rest of `docs/system/` waits for `/architecture-survey`, which the user runs on demand.
- **The go-live** is a section of `4.implementation.checklist.md` (Prepare, Ship, Turn on, After), as in `docs/process/go-live.md`, and every production step follows `docs/process/production-procedures.md`. A refactoring that touches an app shipped as a Docker image has the new image built, published and proven running before the merge (`docs/patterns/image-before-go-live.md`). The user writes to production and handles secrets; you prepare the command with its expected output and check the result.
- **After the merge,** with the main folder back on an updated `main` (`git pull --ff-only origin main`), the worktree and `refactor/<name>` go with `node scripts/worktree.js remove <name>` (it uses `git branch -d`, never `-D`, and refuses a dirty or unmerged worktree); the branch on `origin` goes after the merge, with the `git push origin --delete refactor/<name>` the script printed, which needs the user's authorization. A session does not remove the worktree it runs in.

## 9. Sweep the docs at every transition

Right after a stage acceptance, a merge or a deploy, run the state sweep of `feature-workflow`, adding the refactoring's own words: `refactor/<name>`, and the old names it replaced. After the merge, the old names should appear only in the refactoring's folder, in the glossary's legacy names table and in the rest of `docs/system/` until the next `/architecture-survey`:

```bash
git grep -n -w -E '<old name>|<other old name>' -- ':!docs/refactorings' ':!docs/features'
```

Read each hit in context, and update only what the transition made false.
