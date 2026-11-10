# Refactorings

How a refactoring is planned and done: a change to the structure, the names or the organization of the code, the data or the docs that **does not change what the system does**. Applying the [ubiquitous language](../patterns/ubiquitous-language.md) to the code, splitting a package or breaking a dependency cycle are refactorings, not features.

Sessions working with Claude Code have the project skill `refactoring-workflow` (`.claude/skills/refactoring-workflow/`), which applies this process. It starts from the feature process and changes only what a refactoring needs. Everything else applies as for a feature: the [gates](gates.md), the [registers](findings-and-decisions.md), the [production procedures](production-procedures.md), the [go-live](go-live.md), the [closing](feature-closing.md) and [parallel work](parallel-features.md).

---

## 1. Refactoring, feature, improvement or fix

| The change                                                                                                    | Is                                                    |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| changes what the user sees, a business rule, a public contract or what the system stores                     | a feature ([Feature stages](feature-stages.md))       |
| brings to another app a behavior that a feature in production already specified, with nothing new in the business | an improvement ([Improvements](improvements.md))      |
| fixes a wrong behavior                                                                                        | a fix (`fix:`)                                        |
| changes names, structure, packages, patterns, the shape of the data or the docs, with the same behavior       | a refactoring (`refactor:`)                           |

- **When in doubt, the user decides.** A refactoring that finds it needs to change a behavior stops, and the change becomes a separate feature or fix.
- **A refactoring a feature needs** (swapping a pattern, a deferred rename) goes into the feature when it fits its stages, or becomes its own refactoring when it is large or crosses the repository.

---

## 2. Small refactoring

A refactoring that stays in one package, does not touch the data, the contracts, the configuration or production, and does not change any glossary term, needs no folder. The agent states the plan in two lines, the user agrees, the tests are green before and after, and the commit asks for authorization, as always. Any other refactoring has the folder of section 3.

---

## 3. The refactoring's folder

Each refactoring has a folder `docs/refactorings/NNN.refactoring.<name>/`, numbered in its own sequence, separate from the features' and the improvements' ([index](../refactorings/README.md)):

| File                            | What it holds                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1.refactoring.definition.md`   | the reason, what changes and what does **not** change (the invariants), the scope and what stays out, the new or changed terms, the risks and the id prefix                    |
| `2.refactoring.plan.md`         | the inventory (where each thing appears: packages, collections, contracts, configuration, Dockerfiles and compose, docs, diagrams), the steps in order, the data and the contracts, the deploy and the way back |
| `3.tests.checklist.md`          | the safety net: the tests that already cover what changes, the ones missing, and the checks outside the test suites (the local database, the browser, production)              |
| `4.implementation.checklist.md` | the steps, ticked when they land, and the go-live when the refactoring reaches production                                                                                        |
| `recommendations.md`            | what came up and is not a decision yet ([Findings and decisions](findings-and-decisions.md))                                                                                    |
| `agent.decisions.md`            | what the agent decided alone during the execution                                                                                                                               |

- **Ids with their own prefix,** chosen in the definition and different from every feature's, improvement's and other refactoring's prefix, and never `G`, which is reserved for the repository-level register (`docs/recommendations.md`). Ids are never reused.
- **The folder tells how the refactoring was thought out and done.** What is in production lives in `docs/system/`, as for features.
- The folder is opened from the English templates of the `refactoring-workflow` skill (`.claude/skills/refactoring-workflow/templates/`).

---

## 4. The stages

1. **Definition.** Why change, what changes and what must stay the same. The invariants are the list of what no test, contract or screen may notice. New or changed terms follow the [ubiquitous language](../patterns/ubiquitous-language.md): they come from the user and are checked against the glossary.
2. **Plan.** The inventory of where each thing is, by searching the repository and the database, and the steps in order, each one small enough to end with the tests green. A change that touches the data says whether it is additive; if not, the deploy goes in a maintenance window, as in a feature.
3. **Safety net.** The list of tests that pin today's behavior, for the user to approve before any change.
4. **Execution.** The plan's steps, in order, and the go-live when there is production.

The stages go in order, each one starts from the previous one accepted, and the acceptance is written in the document itself, with the date ([Feature stages](feature-stages.md)).

**The gates** are the features' ([Gates](gates.md)), with one swap: instead of "Write tests" and "Write code", the gate is **"Change code": the safety net approved and green**.

---

## 5. The net comes first

In a refactoring the behavior does not change, so there is no red test to justify it. The TDD rule becomes:

- **No change without a green net.** Before touching anything, the affected behavior is covered by passing tests. What is not covered first gets a characterization test, green against today's code. Packages without tests today (`shared/core`, `shared/application`, `shared/kernel`, `services/ffmpeg`) need their net before any refactoring touches them.
- **A characterization test that fails against today's code** found a defect: it becomes a separate fix, and does not enter the refactoring.
- **At every step, the suite is green.** A step that leaves a test red is undone or fixed before the next one.
- **A test only changes mechanically:** the name, the path, the import or the identifier that the refactoring swaps. An assertion that needs to change is a sign of new behavior: the refactoring stops, and the user decides.
- **The tests are still the specification:** none is weakened to pass.

---

## 6. Branch, merge and deploy

- **The specification reaches `main` by docs pull requests** until the safety net is approved, as in a feature: each acceptance is a small docs PR, which deploys nothing ([Pull requests](pull-requests.md), section 2).
- **The change goes on a `refactor/<name>` branch,** in a worktree outside the project tree, created with `node scripts/worktree.js new <name> --type refactor`. The rules of [Parallel features](parallel-features.md) apply with `refactor/` instead of `feat/`: the integration branch, the optional parallel sessions, sync by merge, `--no-ff` and the end of the branch.
- **One change with code at a time per repository:** a refactoring enters the production queue like a feature.
- **The deploy follows the [go-live](go-live.md)** when the refactoring reaches production: `/pull-request` before its pull request, with the refactoring's terms and legacy names in the glossary, the merge with the user's yes, and the checks afterwards; the rest of the production picture waits for `/architecture-survey`. A docs-only refactoring reaches `main` by a docs pull request, without the queue.
- **Commits** are `refactor:` for the code and `test:` for a characterization test that lands on its own; the merge is `chore: merge refactor/<name> into main (Refactoring NNN)`.

---

## 7. The choices of this process

- **Applying the ubiquitous language to the code is a refactoring, not a feature.**
- **The refactoring process starts from the feature process,** applied by its own skill, `refactoring-workflow`.
- **Four stages, a small refactoring without a folder, the folder in `docs/refactorings/`, the safety net in place of the red test, and the `refactor/<name>` branch.**

Brought from the author's process on 2026-11-10.

---

The other processes: [Feature stages](feature-stages.md), [Findings and decisions](findings-and-decisions.md), [Gates](gates.md), [Production procedures](production-procedures.md), [Pull requests](pull-requests.md), [Go-live](go-live.md), [Feature closing](feature-closing.md), [Parallel features](parallel-features.md) and [Improvements](improvements.md).
