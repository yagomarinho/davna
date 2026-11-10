# __TITLE__ — Agent decisions

Record of the decisions the AI agent (Claude) took alone while building Feature __NNN__, where the documents and the tests did not decide, were ambiguous or contradicted each other. The decisions are already in the code and in the tests, but wait for the user's review.

- **Before deciding,** the agent consults, in this order:
  - the tests of Stage 8 and the decisions recorded in `8.tests.checklist.md`;
  - Stages 6 and 7 of this feature;
  - Stage 5 and the earlier ones;
  - the stages of earlier features and their `agent.decisions.md`.

  What these sources already define does not go in here.

- **Difference from `recommendations.md`:** there goes what is not decided yet; here, what the agent decided and already applied.
- **At the review,** an accepted decision may become a rule in a stage or in an ADR; a changed decision changes the code and the tests together with this record.

---

# 1. How to record

Each decision has a sequential id with the feature's prefix (`DC__P__01`, `DC__P__02`…), which is never reused, and these fields:

| Field    | Content                                                                    |
| -------- | -------------------------------------------------------------------------- |
| Decision | what was decided                                                           |
| Gap      | what the documents said: nothing, something ambiguous or two things in conflict |
| Why      | the reason for the choice                                                  |
| Where    | the code and test files that depend on it                                  |
| Review   | pending; accepted (date); changed (date and what changed)                  |

Decisions are not deleted: a changed decision keeps what changed, so the same discussion does not start again from zero. At the gates, the decisions without review appear as pending items.

---

# 2. Index

| Id  | Package | Decision | Review |
| --- | ------- | -------- | ------ |

---

# 3. Decisions

<!--
Template of a decision:

## DC__P__01 · <short title>

- **Decision:** <what was decided>
- **Gap:** <what the documents said>
- **Why:** <the reason>
- **Where:** `<file>`; `<test>`.
- **Review:** pending.
-->
