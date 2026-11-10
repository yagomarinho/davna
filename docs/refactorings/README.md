# Refactorings

Each refactoring of davna that needs a folder (anything beyond a small refactoring) has one here, planned and done by [Refactorings](../process/refactoring.md) and opened with the `refactoring-workflow` skill, from its English templates (`.claude/skills/refactoring-workflow/templates/`).

## Naming

- **The folder:** `NNN.refactoring.<name>/`, where `NNN` is the next three-digit number of the refactorings' own sequence (separate from the features' and the improvements'), and `<name>` is a short English slug with hyphens, e.g. `001.refactoring.config-modules`. Numbers are never reused.
- **The branch:** `refactor/<name>`, with the same slug, created when the safety net is approved ([Parallel features](../process/parallel-features.md)).
- **The id prefix:** chosen in the definition, different from every feature's, improvement's and other refactoring's, and never `G` (reserved for [`docs/recommendations.md`](../recommendations.md)).

## The files of a refactoring

| File                            | What it holds                                                   |
| ------------------------------- | --------------------------------------------------------------- |
| `1.refactoring.definition.md`   | the reason, the invariants, the scope, the terms, the risks, the prefix |
| `2.refactoring.plan.md`         | the inventory, the steps, the data and contracts, the deploy and the way back |
| `3.tests.checklist.md`          | the safety net                                                  |
| `4.implementation.checklist.md` | the steps and the go-live                                       |
| `recommendations.md`            | findings that are not decisions yet                             |
| `agent.decisions.md`            | the agent's decisions                                           |

## Index

| Refactoring | Folder | Prefix | State |
| ----------- | ------ | ------ | ----- |
