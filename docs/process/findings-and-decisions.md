# Findings and decisions

What to do with what comes up while a feature is built and is not in the stages: a gap, an idea, a choice nobody made. Each thing has its register, so it neither widens the scope nor rewrites a stage. Most registers live in the feature folder; what belongs to no feature, refactoring or improvement yet goes to the repository-level register.

---

# 1. Where each thing goes

| What came up                                                                            | Where it goes                                                          |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A gap, an improvement, a need before a milestone, inside a feature                      | the feature's `recommendations.md`, as a new item (`Rnn`, or `RXnn`)   |
| A choice of the agent, where the documents and the tests did not decide                 | the feature's `agent.decisions.md`, as a decision (`DCnn`, or `DCXnn`) |
| A user decision                                                                         | where it applies: the stage, the checklist or the item it answers      |
| A debt, risk or opportunity that belongs to no open feature, refactoring or improvement | [`docs/recommendations.md`](../recommendations.md), as `RGnn`          |
| A solution the repository will reuse                                                    | `docs/patterns/` ([index](../patterns/README.md))                      |

Refactorings and improvements keep the same two registers in their own folders ([Refactorings](refactoring.md), [Improvements](improvements.md)).

---

# 2. `recommendations.md`

Holds what is not a decision yet. Nothing in it is implemented before it becomes a decision in a stage or in an ADR.

- **Each item has:** type (flow break, need, improvement, opportunity, recommendation), status (open, deferred, accepted, discarded) with the date, origin, trigger (the milestone, the volume or the incident that forces a decision) and what it affects.
- **The text follows the order:** what happens today, the problem, the proposal and, when there are any, alternatives and impact.
- **An accepted item** points to the decision that resolved it and stops changing. **An item that moved** without changing status gets a note "Update (YYYY-MM-DD)".

---

# 3. `agent.decisions.md`

Holds what the agent decided alone and has already applied. Each decision waits for the user's review.

- **Before deciding,** the agent consults the sources in the order the file itself gives: the tests and the decisions of Stage 8, Stages 6 and 7, Stage 5 and the earlier ones, and the earlier features. What they already define is not the agent's decision.
- **Each decision has:** the decision, the gap (nothing, something ambiguous or two things in conflict), the why, where it is in the code and in the tests, and the review (pending, accepted or changed, with the date).
- **A changed decision** changes the code and the tests together with the record.

---

# 4. The repository-level register: `docs/recommendations.md`

Holds the findings that belong to no feature, refactoring or improvement yet: a debt found while doing something else, a risk in a package nobody is changing, a direction for the whole repository (such as a stack migration).

- **Ids are `RGnn`.** `G` is the reserved repository-level prefix: no feature, refactoring or improvement ever uses `G` as its id prefix, so an `RGnn` is never confused with a change's `Rnn` or `RXnn`.
- **Same item format as section 2:** type, status (open, deferred, taken, accepted, discarded) with the date, origin, trigger, what it affects, and the text in the order today, problem, proposal, alternatives and impact.
- **Same rule:** nothing in it is implemented before it becomes a decision. An item is resolved only by a feature, a refactoring or an improvement, or by a fix that goes through its own [pull request](pull-requests.md).
- **When a change takes an item,** its Stage 1 (or the refactoring or improvement definition) cites it ("RG04"), and the item gets the status "taken" with the date and the folder that took it, for example "Taken on YYYY-MM-DD by `docs/refactorings/NNN.refactoring.<name>/`". When that change reaches `main`, the item becomes accepted, pointing to the decision that resolved it, and stops changing. It is never moved or copied into the change's own `recommendations.md`.
- **A finding inside an open change** that concerns only that change stays in that change's `recommendations.md`. One that outlives the change goes to `docs/recommendations.md`, with the change as its origin.
- **Written on davna's own terms.** An item states what davna needs as an open-source project: a contract, a port, a fix, a cleanup. It never names a project that builds on davna.

---

# 5. Rules for every register

- **Increasing ids, never reused,** with the change's prefix when there is a risk of confusion, and never `G` outside the repository-level register. With parallel sessions inside the same feature, each uses the range its briefing reserves, and the sequence may have gaps ([Parallel features](parallel-features.md)).
- **Items are not deleted.** Accepted, discarded or changed, the item keeps its outcome, so the same discussion does not start again from zero.
- **At the gates,** the open items whose trigger has arrived (in the change's registers and in `docs/recommendations.md`) and the decisions without review appear as pending items (see [Gates](gates.md)).

---

The other processes: [Feature stages](feature-stages.md), [Gates](gates.md), [Production procedures](production-procedures.md), [Pull requests](pull-requests.md), [Go-live](go-live.md), [Feature closing](feature-closing.md), [Parallel features](parallel-features.md), [Refactorings](refactoring.md) and [Improvements](improvements.md).
