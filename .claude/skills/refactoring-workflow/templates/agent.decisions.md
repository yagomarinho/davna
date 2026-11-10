# {{TITLE}} — Agent decisions

Record of the decisions the AI agent (Claude) took alone during Refactoring {{NNN}}, where the documents and the tests did not decide, were ambiguous or contradicted each other. The decisions are already in the code and in the tests, but wait for the user's review.

- **Before deciding,** the agent consults, in this order:
  - the safety net (`3.tests.checklist.md`) and the decisions recorded in it;
  - the plan and the definition of this refactoring;
  - the stages of the features it touches and their `agent.decisions.md`;
  - the repository's patterns (`docs/patterns/`), with the glossary of the [ubiquitous language](../../patterns/ubiquitous-language.md).

  What these sources already define does not go in here.

- **Difference from `recommendations.md`:** there goes what is not decided yet; here, what the agent decided and already applied.
- **Never a domain name:** the terms come from the user. A name the agent had to choose alone is a technical name, and stays here until the review.
- **At the review,** an accepted decision may become a rule in a stage or in a pattern; a changed decision changes the code and the tests together with this record.

---

# 1. How to record

Each decision has a sequential id with the refactoring's prefix (`DC{{P}}01`, `DC{{P}}02`…), which is never reused, and these fields:

| Field    | Content                                                                         |
| -------- | ------------------------------------------------------------------------------- |
| Decision | what was decided                                                                |
| Gap      | what the documents said: nothing, something ambiguous or two things in conflict |
| Why      | the reason for the choice                                                       |
| Where    | the code and test files that depend on it                                       |
| Review   | pending; accepted (date); changed (date and what changed)                       |

Decisions are not deleted: a changed decision keeps what changed, so the same discussion does not start again from zero. At the gates, the decisions without review appear as pending items.

---

# 2. Index

| Id  | Package | Decision | Review |
| --- | ------- | -------- | ------ |

---

# 3. Decisions

<!--
Template of a decision:

## DC{{P}}01 · <short title>

- **Decision:** <what was decided>
- **Gap:** <what the documents said>
- **Why:** <the reason>
- **Where:** `<file>`; `<test>`.
- **Review:** pending.
-->
