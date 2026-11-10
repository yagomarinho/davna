# Feature closing

What to do after the feature is turned on in production, so that the documents and the manual procedures tell what actually exists.

---

# 1. The documents with the new state

The stages and documents that said "on the branch", "not deployed" or "not yet" now say what is in production, with the date. The same sweep applies at every state transition (the acceptance of a stage, the merge, the deploy), not only at the end: a forgotten state sentence becomes wrong information for the next person.

The `CLAUDE.md` files keep no state and no history, only the rules, the commands, the conventions, the pitfalls and where to look: they change when the feature changes one of these, and a state sentence found in one of them goes to the feature's documents.

The go-live does not redo the production picture in `docs/system/`: before the pull request, `/pull-request` takes to the glossary only the feature's terms (see [Go-live](go-live.md), section 2). The picture is redone on demand by `/architecture-survey`, when the user wants to see the architecture or when `/pull-request` reminds that it fell behind, and the header of each document states up to which `main` commit it holds. When production changes again after the deploy, a data change of section 3 or a fix reaches `main` by its own pull request, prepared by `/pull-request`, like every change; what was done by hand waits for the next `/architecture-survey`, which the user may ask for right away.

The items of [`docs/recommendations.md`](../recommendations.md) that the feature took become accepted, pointing to the decision that resolved them ([Findings and decisions](findings-and-decisions.md), section 4).

---

# 2. The manual procedures shrink

- **What the feature now does leaves the manual procedures:** the documented command, the script, the tests that covered it and the text.
- **The turn-on script leaves after it runs.** The diagnosis that stays useful remains, in a section of its own.
- **Test records in production are deleted** with the same code paths a deletion request uses, plus what they do not cover, and with the rehearsal (`countDocuments` on the same filter, a backup first) before ([Production procedures](production-procedures.md), section 2).

---

# 3. What comes after the deploy

- **The data changes that can only come with the feature in production:** tightening a `$jsonSchema` validator (from `validationAction: "warn"` or `validationLevel: "moderate"` to `error` and `strict`) once the existing documents comply, dropping a field or an index the old code still used, and retiring a manual procedure. Each one is tried against the local Mongo of `docker-compose.yml` before the commit.
- **The waived pending items and the open reviews** stay in the checklists, for the next round.
- **The feature's worktree and branch are already gone** right after the merge (`node scripts/worktree.js remove <name>`), and the `origin` branch right after the pull request's merge ([Parallel features](parallel-features.md)). If one still exists, it goes now.
- **The lessons** that would help the next feature go to the skill `feature-workflow` (the operational cautions) or to `docs/patterns/` (the reusable solutions, [index](../patterns/README.md)). A finding that belongs to no feature goes to [`docs/recommendations.md`](../recommendations.md).

---

The other processes: [Feature stages](feature-stages.md), [Findings and decisions](findings-and-decisions.md), [Gates](gates.md), [Production procedures](production-procedures.md), [Pull requests](pull-requests.md), [Go-live](go-live.md), [Parallel features](parallel-features.md), [Refactorings](refactoring.md) and [Improvements](improvements.md).
