# Features

Each feature of davna has a folder here, specified and built by the nine stages of [Feature stages](../process/feature-stages.md) and opened with the `feature-workflow` skill, from its English templates (`.claude/skills/feature-workflow/templates/`).

## Naming

- **The folder:** `NNN.feature.<name>/`, where `NNN` is the next three-digit number of the features' own sequence (separate from the refactorings' and the improvements'), and `<name>` is a short English slug with hyphens, e.g. `001.feature.conductor-contract`. Numbers are never reused.
- **The branch:** `feat/<name>`, with the same slug, created when the first test is about to be written ([Parallel features](../process/parallel-features.md)).
- **The id prefix:** each feature chooses one in stage 1 (e.g. `C` gives `RNC01`, `UC-C01`, `DCC01`, `RC01`), different from every other feature's, refactoring's and improvement's, and never `G`, which is reserved for the repository-level register ([`docs/recommendations.md`](../recommendations.md)).
- **Citing another feature:** "Feature NNN, RN09", never a copy of its text.

## The files of a feature

| File                           | What it holds                                                          |
| ------------------------------ | ---------------------------------------------------------------------- |
| `1.feature.definition.md`      | goal, scope, out of scope, business rules and personal data            |
| `2.system.flow.md`             | flows and interface states                                             |
| `3.use.cases.md`               | use cases                                                              |
| `4.modules.definition.md`      | the modules that are born, change or go away                           |
| `5.system.contracts.md`        | routes, DTOs, socket events, errors and permissions                    |
| `6.data.model.md`              | collections, entities and their versions, indexes, retention, migrations |
| `7.architecture.definition.md` | decisions, infrastructure, risks and the spike                         |
| `8.tests.checklist.md`         | one item per test                                                      |
| `9.implementation.checklist.md` | code and go-live                                                      |
| `recommendations.md`           | findings that are not decisions yet                                    |
| `agent.decisions.md`           | the agent's decisions, waiting for the user's review                   |

## Index

| Feature | Folder | Prefix | State |
| ------- | ------ | ------ | ----- |
