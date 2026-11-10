# Improvements

Each improvement of davna has a folder here: it brings to another app a behavior that a feature in production already specified, by [Improvements](../process/improvements.md). Stages 1 to 8 are waived only by the user's decision, quoted in the improvement's definition.

## Naming

- **The folder:** `NNN.improvement.<name>/`, where `NNN` is the next three-digit number of the improvements' own sequence (separate from the features' and the refactorings'), and `<name>` is a short English slug with hyphens, e.g. `001.improvement.client-session-refresh`. Numbers are never reused.
- **The branch:** `feat/<name>`, with the same slug; the folder is born on the branch, with its first commit.
- **The id prefix:** chosen in the definition, different from every feature's, refactoring's and other improvement's, and never `G` (reserved for [`docs/recommendations.md`](../recommendations.md)). Only two id forms: `R<prefix>nn` and `DC<prefix>nn`.

## The files of an improvement

| File                            | What it holds                                                    |
| ------------------------------- | ---------------------------------------------------------------- |
| `1.improvement.definition.md`   | the origin, the user's decision, what is reused, the delta, the prefix |
| `2.tests.checklist.md`          | the tests mirrored from the origin feature                       |
| `3.implementation.checklist.md` | the code per card, the checks, the go-live and the closing       |
| `recommendations.md`            | findings that are not decisions yet                              |
| `agent.decisions.md`            | the agent's decisions                                            |

## Index

| Improvement | Folder | Origin | Prefix | State |
| ----------- | ------ | ------ | ------ | ----- |
