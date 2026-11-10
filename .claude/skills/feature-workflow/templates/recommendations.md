# __TITLE__ — Recommendations and opportunities

Living record of what comes up while building Feature __NNN__ and is not a decision yet: recommendations, needs, flow breaks, improvements and opportunities.

It is not a stage and does not change the feature's scope. The stages (1 to 9) define what is built; this document keeps what is left for later and why. Nothing here is implemented before it becomes a decision in a stage or in an ADR.

A finding that outlives this feature goes to the repository-level register, [`docs/recommendations.md`](../../recommendations.md) (`RGnn`), with this feature as its origin ([Findings and decisions](../../process/findings-and-decisions.md), section 4).

---

# 1. How to record

Each item has a sequential id with the feature's prefix (`R__P__01`, `R__P__02`…), which is never reused, and these fields:

| Field      | Content                                                      |
| ---------- | ------------------------------------------------------------ |
| Type       | one of the types below                                       |
| Status     | one of the statuses below, with the date of the last change  |
| Origin     | where and when the subject came up                           |
| Trigger    | what forces a decision: a milestone, a volume, an incident   |
| Affects    | stages, modules and documents that change if the item is accepted |
| Depends on | items that must come first; only when there are any          |

The text follows the order: what happens today, the problem, the proposal and, when there are any, alternatives and impact.

| Type           | When to use                                                     |
| -------------- | --------------------------------------------------------------- |
| Flow break     | a path of use the feature does not close, or closes only in part |
| Need           | something mandatory before a milestone                          |
| Improvement    | something that already works and can work better                |
| Opportunity    | something new the current design makes cheap                    |
| Recommendation | technical or product advice, without a deadline                 |

| Status    | Means                                                                          |
| --------- | ------------------------------------------------------------------------------ |
| open      | recorded, not analyzed yet                                                     |
| deferred  | analyzed; waits for the trigger                                                |
| accepted  | became a decision; the item points to it (D, AD, ADR or card) and stops changing |
| discarded | will not be done; the item keeps the reason                                    |

- Items are not deleted: accepted or discarded, the item stays here with its outcome, so the same discussion does not start again from zero.
- An item that moved without changing status gets a note "**Update (YYYY-MM-DD).**".
- At the gates (merge and go-live), the open items whose trigger has arrived appear as pending items.

---

# 2. Index

| Id  | Item | Type | Status | Trigger |
| --- | ---- | ---- | ------ | ------- |

---

# 3. Items

<!--
Template of an item:

## R__P__01 · <short title>

- **Type:** <type>
- **Status:** <status> (YYYY-MM-DD)
- **Origin:** <where and when it came up>
- **Trigger:** <what forces a decision>
- **Affects:** <stages, modules, documents>

**Today.** <what happens>

**Problem.** <why this is a problem>

**Proposal.** <what to do>

**Alternatives and impact.** <when there are any>
-->
