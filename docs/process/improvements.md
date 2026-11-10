# Improvements

How an improvement is made. An improvement brings to another app a behavior that an earlier feature already specified and that is in production, using that feature's stages as the specification. In davna, an example is bringing to `apps/client.app` a behavior that a feature specified and delivered in `apps/monolith.api`, or bringing to a second backend app a middleware behavior another app already has.

The process starts from the feature process and changes only what an improvement needs: there are no stages 1 to 8. Everything else applies as for a feature: the [gates](gates.md), the [registers](findings-and-decisions.md), the [production procedures](production-procedures.md), the [pull requests](pull-requests.md), the [go-live](go-live.md), the [closing](feature-closing.md) and [parallel work](parallel-features.md).

---

## 1. Improvement, feature, refactoring or fix

| The change                                                                                                                         | Is                                               |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| changes what the user sees, a business rule, a public contract or what the system stores                                          | a feature ([Feature stages](feature-stages.md))  |
| brings to another app a behavior that a feature in production already specified, with no new rule, contract, stored data or term | an improvement                                   |
| fixes a wrong behavior                                                                                                             | a fix (`fix:`)                                   |
| changes names, structure, packages, patterns, the shape of the data or the docs, with the same behavior                           | a refactoring ([Refactorings](refactoring.md))   |

It is Jira's _Improvement_ and GitHub's _enhancement_. It is not a fix, because nothing is broken: the app was left without the behavior on purpose. It is not a refactoring either, because the app's behavior changes. The commit is `feat:`, and the branch is `feat/<name>`.

An improvement fits when all of this holds:

- **The specification exists:** the business rules, the acceptance criteria and the decisions of a feature in production describe the behavior.
- **Nothing new in the business:** no business rule, public contract (route, DTO, socket event), collection, entity version or glossary term. The delta is only adaptation: where the behavior sits in the target app, which states receive it, the keys, the configuration.
- **A recorded origin:** usually an item of the origin feature's `recommendations.md` whose trigger has arrived, or a request from the user.

**The user decides.** An improvement that finds it needs a new rule, contract, data or term stops. The new part becomes a feature, or the user decides it goes into the improvement. Saying the change is an improvement waives stages 1 to 8, and the definition quotes that decision in the user's words. The agent may propose treating something as an improvement, but never presumes the waiver.

---

## 2. What the waiver removes and what stays

| Removed                                          | Stays                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| stages 1 to 7 and their acceptances              | the improvement's definition (section 3), which says what is reused from the origin feature and the delta |
| the approval of the tests checklist before the first test | the tests checklist, recorded; the user may ask to approve it first                              |
| the specification on `main` before the branch    | the folder is born on the branch, with the first commit                                               |

Still in force:

- **TDD:** each test is written and seen failing before the code that makes it pass, and no test is weakened to pass.
- **The authorization of each commit, each push of a branch with its pull request, and each merge.**
- **`/pull-request` before the pull request, and the go-live's operational list.**
- **The review of the agent's decisions** before the merge into `main` ([Gates](gates.md), "Merge into `main`").

---

## 3. The improvement's folder

Each improvement has a folder `docs/improvements/NNN.improvement.<name>/`, with its own numbering, separate from the features' and the refactorings' ([index](../improvements/README.md)):

| File                            | What it holds                                                                                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1.improvement.definition.md`   | the origin (the item and the origin feature, the trigger) and the user's decision, quoted; what is reused, in tables: each business rule ("applies" or "out", with the reason), the acceptance criteria and the decisions that apply; the delta in the app, by subject; what stays out; personal data and the privacy policy; the terms; the id prefix; where the work happens |
| `2.tests.checklist.md`          | the tests mirrored from the origin feature's and adapted to the app, in cards, each citing the rule, criterion or decision it comes from; what stays out of the tests (components and routes), checked in the browser                                                                                                               |
| `3.implementation.checklist.md` | the code per card, the interface, the checks, the docs, the go-live (Prepare, Ship, Turn on, After) and the closing, ticked when they land                                                                                                                                                                                              |
| `recommendations.md`            | what came up and is not a decision yet ([Findings and decisions](findings-and-decisions.md))                                                                                                                                                                                                                                       |
| `agent.decisions.md`            | what the agent decided alone, waiting for the user's review before the merge into `main`                                                                                                                                                                                                                                            |

- **Ids with their own prefix,** chosen in the definition and checked against the features', refactorings' and other improvements' prefixes, never `G` (reserved for `docs/recommendations.md`). Ids are never reused.
- **Only two id forms:** `R<prefix>nn` in the recommendations and `DC<prefix>nn` in the agent's decisions. There is no `D<prefix>n`, because there is no stage with decisions, and that form may collide with ids that already exist in the features' stages. The user's decisions stay in the definition, quoted in the user's words.
- **The terms are the origin feature's.** The name of the target app follows the production glossary (`docs/system/language.md`).
- **The folder tells how the improvement was thought out and done.** What is in production lives in `docs/system/`.

---

## 4. How an improvement moves

1. **The origin and the decision.** The session in the main folder checks the criteria of section 1 against the origin feature and the target app, and the user decides.
2. **The branch.** The session in the main folder creates the integration branch from `main` and its worktree outside the project tree (`node scripts/worktree.js new <name>`, [Parallel features](parallel-features.md), section 3). The work happens in that worktree, or in an optional parallel session cut from it (section 9 there).
3. **The briefing.** Besides what a session's briefing asks for ([Parallel features](parallel-features.md), section 9), it carries the user's decision in the user's words, the origin feature and the item that triggered it, the files of the origin app that serve as a mold, and the decisions already made.
4. **The definition** comes first on the branch, then the tests checklist, then the code, card by card, by TDD. Choices that the origin feature's docs do not make go to `agent.decisions.md`, and gaps go to `recommendations.md`.
5. **The checks.** Those of the package (tests, `yarn typecheck`, lint and build) and, on the integration branch synced with `main`, those of the whole repository ([Parallel features](parallel-features.md), section 5). An interface is checked in the browser, in light and dark themes when the app has them, and at 375 px. The checklist records what was not checked.
6. **The user's review** of the agent's decisions and of the open items comes before the merge into `main`.
7. **The merges.** The integration branch goes to `main` by its pull request, merged with a merge commit and its own authorization (and an optional parallel session's branch goes to the integration branch first, by a local `--no-ff` merge with its own authorization).
8. **The go-live**, in the form of the [production procedures](production-procedures.md) (who, effect, check, blocks), and the **closing**, in the form of the [feature closing](feature-closing.md).

| Who                           | What                                                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The session in the worktree   | the improvement's folder, the tests, the code, the commits, and the merge of a parallel session into the integration branch                                                  |
| The session in the main folder | the integration branch, the process and pattern docs the improvement changes (on their own `docs/<name>` pull requests), the update of `main` after the merge, and the end of the worktree and branches (section 7) |

A session in a worktree does not write to the main folder: the main folder is another checkout, outside the session's working folder. What belongs there (process docs, the end of the worktree) the worktree's session hands over to the main folder's session by message; `/pull-request` for the improvement's own branch runs in its worktree.

---

## 5. Copying from the origin feature

- **The target app copies, in the style it already has.** The components and logic of the origin app are copied into the target app. A package shared by both is a separate refactoring ([Refactorings](refactoring.md)), which the improvement does not anticipate. What already lives in a shared package (`shared/*`, a module's exported handlers) is imported.
- **A gate or command the origin app has gets its copy in the target app,** and the process docs that cite the origin app start citing both. That change is a process change and goes through the main folder.
- **New configuration goes into the app's configuration module,** mandatory and with no production default ([configuration](../patterns/configuration.md)). If the deploy depends on it, the go-live asks the user to add it where production reads it (the server's `.env`, or the Vercel panel for `apps/client.app`) **before** the merge, with the variable's name and what to check afterwards.
- **The privacy policy** (`apps/client.app/src/modules/feedback/pages/privacy.politics.tsx`) is checked against what the target app starts to store, even when the conclusion is that nothing changes.

---

## 6. The closing

It is the [feature closing](feature-closing.md), plus what the improvement adds:

- **The origin item** moves to "accepted" in the origin feature's `recommendations.md`, pointing to the improvement's folder. The items of that feature that depended on it get an "Update" with the outcome.
- **The definition** says, at the top, that the improvement is in production, with the pull request that merged it (`#<n>`) and the date of the deploy.
- **The docs that cite the origin app** for a behavior the improvement brought start citing both (the gates, the patterns, the root `CLAUDE.md`). The production picture waits for the next `/architecture-survey`.

---

## 7. The end of the branch

The end of the branch follows section 10 of [Parallel features](parallel-features.md): the worktree and the branches go right after the merge into `main` (`node scripts/worktree.js remove <name>`); the branch on `origin`, right after the merge.

- **A session does not remove the worktree it runs in.** After the merge, the session in the main folder ends or archives the worktree's session, with the user's yes, and then removes the worktree.
- **The final check:** `node scripts/worktree.js list` and `git worktree list` without the worktree, `git branch -a` without the branches, and `git ls-remote --heads origin` without the integration branch.

---

## 8. The choices of this process

- **The waiver of stages 1 to 8 is the user's decision, quoted in each improvement's definition.**
- **The "improvement" type instead of `fix`,** with the folder `docs/improvements/`.
- **The criteria of section 1, the five-file folder, the two id forms, the split between the worktree's session and the main folder's session, and the end of the worktree right after the merge.**

Brought from the author's process on 2026-11-10.

---

The other processes: [Feature stages](feature-stages.md), [Findings and decisions](findings-and-decisions.md), [Gates](gates.md), [Production procedures](production-procedures.md), [Pull requests](pull-requests.md), [Go-live](go-live.md), [Feature closing](feature-closing.md), [Parallel features](parallel-features.md) and [Refactorings](refactoring.md).
