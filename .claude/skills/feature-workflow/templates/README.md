# Feature templates

The files a feature folder (`docs/features/NNN.feature.<name>/`) is opened from, one per stage plus the two registers. The process they serve is [Feature stages](../../../../docs/process/feature-stages.md); when a template and a process document disagree, the document wins.

| File                            | Copied when                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `1.feature.definition.md`       | the feature is opened                                             |
| `recommendations.md`            | the feature is opened                                             |
| `agent.decisions.md`            | the feature is opened                                             |
| `2.system.flow.md` to `7.architecture.definition.md` | the previous stage is accepted, one at a time |
| `8.tests.checklist.md`          | Stages 1 to 7 are accepted                                        |
| `9.implementation.checklist.md` | Stage 8 is approved and its writing decisions confirmed, on `feat/<name>` |

## Placeholders

Replace every placeholder when a template is copied, and check that none is left:

```bash
grep -rn "__[A-Z]*__" docs/features/NNN.feature.<name>/
```

| Placeholder | Meaning                                    | First feature | Later features (prefix `X`) |
| ----------- | ------------------------------------------ | ------------- | --------------------------- |
| `__TITLE__` | the feature title, in English              | `Conductor contract` | `Lesson history`       |
| `__NNN__`   | the feature number, three digits           | `001`         | `004`                       |
| `__P__`     | the feature's id prefix                    | (empty)       | `X`                         |

With an empty `__P__`, `UC-__P__01` becomes `UC-01` and `R__P__01` becomes `R01`. The prefix is one capital letter that no other feature, refactoring or improvement uses, and never `G`, which is reserved for the repository-level register (`docs/recommendations.md`). It is fixed by the last decision of Stage 1.

## Ids built from the prefix

The templates need no other placeholder:

| Written as  | Becomes                    | Why                                                                                       |
| ----------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| `DM__P__`   | `DM1`, `DMX1`              | [Feature stages](../../../../docs/process/feature-stages.md) gives data-model decisions the form `DMn`, prefixed `DMXn`, so the feature prefix is enough |
| `UI-__P__`  | `UI-01`, `UI-X01`          | the interface state codes follow the same shape as the use cases (`UC-__P__nn`)           |
| `@davna`    | itself (a literal)         | every package of this repository is `@davna/<name>`                                       |

The ids, in English:

| Id                          | Where                       | Prefixed?                                     | Example (prefix `X`) |
| --------------------------- | --------------------------- | --------------------------------------------- | -------------------- |
| `BRnn` business rule        | Stage 1, section 4          | no; cited as "Feature 003, BR09"              | `BR09`               |
| `ACnn` acceptance criterion | Stage 1, section 5          | no                                            | `AC04`               |
| `Dn` stage decision         | Stages 1 to 5, one series   | no; each stage continues the last number      | `D27`                |
| `Flow NN`                   | Stage 2                     | no                                            | `Flow 12`            |
| `UI-__P__nn` interface state | Stage 2                    | yes                                           | `UI-X10`             |
| `UC-__P__nn` use case       | Stage 3                     | yes                                           | `UC-X08`             |
| `AFnn`, `EXnn`              | Stage 3, inside a use case  | no                                            | `AF02`, `EX01`       |
| `DM__P__n` data-model decision | Stage 6                  | yes                                           | `DMX16`              |
| `AD__P__n` architecture decision | Stage 7                | yes                                           | `ADX21`              |
| `S__P__n` spike item        | Stage 7                     | yes                                           | `SX3`                |
| open point                  | Stage 8                     | no; numbered inside the stage ("point 6")     | `point 6`            |
| `R__P__nn` recommendation   | `recommendations.md`        | yes                                           | `RX07`               |
| `DC__P__nn` agent decision  | `agent.decisions.md`        | yes                                           | `DCX12`              |

Other conventions of these templates:

- **Dates** are `YYYY-MM-DD`.
- **The acceptance block** reads "**Accepted by the user on YYYY-MM-DD,** …" (Stage 8: "**Approved by the user on YYYY-MM-DD,** …"); until then, "**Under review.**".
- **The go-live groups** are Prepare, Ship, Turn on and After ([Go-live](../../../../docs/process/go-live.md)).
- **Template comments** (`<!-- … -->`) go away as each section is written; an accepted stage has none.

## Copying a template

```bash
dest=docs/features/NNN.feature.<name>
mkdir -p "$dest"
for f in 1.feature.definition.md recommendations.md agent.decisions.md; do
  cp ".claude/skills/feature-workflow/templates/$f" "$dest/$f"
done
grep -rn "__[A-Z]*__" "$dest"
```
