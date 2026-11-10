# Feature stages

How a feature is specified and built, from the idea to the code, in nine stages.

Whoever works with Claude Code has the project skill `feature-workflow` (`.claude/skills/feature-workflow/`), which applies this and the other processes in `docs/process/`. The documents are the source; the skill adds no rule. A feature is opened from the English templates in `.claude/skills/feature-workflow/templates/`.

A change that does not alter behavior (names, structure, packages, patterns) is a refactoring and follows [Refactorings](refactoring.md), with the skill `refactoring-workflow`. A behavior that a feature in production already specified, taken to another app with nothing new in the business, is an improvement and follows [Improvements](improvements.md), without Stages 1 to 8.

---

# 1. The feature folder

Each feature has a folder `docs/features/NNN.feature.<name>/` (`<name>` is an English slug with hyphens), with the numbered stages and two unnumbered registers (see [Findings and decisions](findings-and-decisions.md)):

| File                            | What it holds                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `1.feature.definition.md`       | goal, problem, scope, out of scope, business rules (`BRnn`)                                            |
| `2.system.flow.md`              | the numbered flows, the interface states and the wireframes (`2.wireframes/`)                          |
| `3.use.cases.md`                | the use cases (`UC-nn`): actor, input, preconditions, flows, exceptions                                |
| `4.modules.definition.md`       | the packages and modules that are born, change or go away, and the manual procedures the feature retires |
| `5.system.contracts.md`         | HTTP routes, WebSocket events, DTOs (yup), ports, errors and permissions                               |
| `6.data.model.md`               | MongoDB collections, indexes, `$jsonSchema` validators, isolation, retention and the migration order (`DMn`) |
| `7.architecture.definition.md`  | the architecture decisions (`ADn`), the infrastructure, the risks and the spike                        |
| `8.tests.checklist.md`          | the tests, one per item, approved before any test code                                                 |
| `9.implementation.checklist.md` | the code, in dependency order, and the go-live                                                         |
| `recommendations.md`            | what came up and is not a decision yet (`Rnn`)                                                         |
| `agent.decisions.md`            | what the agent decided alone during the implementation (`DCnn`)                                        |

Wireframes stay light: text, small images or draw.io files in `2.wireframes/`, like the diagrams in `docs/project/`. A store for heavy media outside git is not available yet ([`docs/recommendations.md`](../recommendations.md), RG12).

The feature folder tells how the feature was thought and built. What is in production, with all features together, lives in `docs/system/`, the picture that `/architecture-survey` redoes on demand, up to the `main` commit that the header of each document states; what was merged after it is in the pull requests merged into `main` since that commit ([Pull requests](pull-requests.md)). Findings that belong to no feature yet live in the repository-level register, [`docs/recommendations.md`](../recommendations.md).

---

# 2. The stages

The stages go in order. Each starts from the previous one, accepted, and ends with the open decisions it leaves for the next, each with a recommendation.

1. **Definition.** What the feature does, for whom, and what stays out. The business rules are born here, and so is the list of personal data the feature stores, on which the privacy policy depends. The stage also lists the items of `docs/recommendations.md` the feature takes over.
2. **Flows.** Each path of use, with the states the interface must show, including the error and empty ones.
3. **Use cases.** The flows turned into complete use cases, each exception with its result.
4. **Modules.** Which parts of the system (apps, modules, shared packages, services) are born, change or cease to exist, what each must not do, and which manual production procedures the feature makes unnecessary. The direction of dependencies holds: `kernel` and `core` know no module, modules never import each other, and apps compose them.
5. **Contracts.** The boundaries between modules and apps: what enters and leaves each HTTP route, WebSocket event, handler and port, the errors and the permissions. A contract that projects building on davna will consume is an extension point and says so.
6. **Data.** The persistence model, what MongoDB guarantees (indexes, unique keys, `$jsonSchema` validators) and what stays in the domain, the isolation, the retention, the deletion and the order of the migrations. Versioned migration scripts are not available yet ([`docs/recommendations.md`](../recommendations.md), RG11): until they exist, each change to a collection is written as a [production procedure](production-procedures.md).
7. **Architecture.** How it is built and deployed: packages, Docker images, environment variables and secrets, infrastructure (`docker-compose.prod.yml`, Vercel), risks, the assumptions about third parties (OpenAI, Firebase, AWS S3, Google Sheets) and how to validate everything for real (see [Go-live](go-live.md), section 3).
8. **Tests.** The list of all tests, for the user to approve before any test code.
9. **Implementation.** The code that makes the tests pass, in the order in which one package depends on another; then the data changes, the Docker images and compose files, the retired procedures, the interface and the refactorings; last, the [go-live](go-live.md).

---

# 3. Rules for every stage

- **Only what the feature adds.** A new feature covers the delta. The stages of earlier features remain valid and are cited by stage and section ("Feature 001, BR09"), never copied. A decision that contradicts an old stage is recorded in the new feature; the old stage is not rewritten.
- **Prefixed ids.** When the ids of two features can be confused, the new one's take a letter prefix, for example `UC-Xnn`, `BRXnn`, `DMXn`, `ADXn`, `RXnn`, `DCXnn`. The letter `G` is reserved for the repository-level register and is never a feature prefix ([Findings and decisions](findings-and-decisions.md), section 4). Ids are never reused.
- **The base is stated when another feature is still changing.** A stage that starts from what another feature has not taken to production yet cites that feature's stage and section and says so. The code only starts after the other one reaches `main` ([Parallel features](parallel-features.md)).
- **Stages are a base, not the source of truth.** Once the implementation starts, the code, the tests and the accepted ADRs prevail.
- **Acceptance is written.** A stage is accepted when the user accepts it, and the document itself records it, with the date and what the user's answer changed.
- **Nothing is deleted.** What stops applying in a checklist is struck through; in the registers, it gets its outcome.
- **davna stands alone.** A feature is written on davna's own terms. When a need comes from a project that builds on davna, it becomes a generic extension point, port or contract that any such project can consume; davna never depends on them and never names them.

---

# 4. Stages 8 and 9 and TDD

- **No test before Stage 8 is accepted,** and no code before a test that fails for it.
- **The specification reaches `main` by docs pull requests; the tests and the code, on a branch.** Each stage, until Stage 8 is approved, is written in the main folder on a short-lived `docs/<name>` branch, and its acceptance is a small docs pull request merged into `main` before the next stage starts from it, deploying nothing ([Pull requests](pull-requests.md), section 2). The first test is born on the branch `feat/<name>`, in a worktree outside any project tree (`$WORKTREES_ROOT/davna/<name>`, created by `node scripts/worktree.js new <name>`), and from then on the feature folder changes only there ([Parallel features](parallel-features.md)).
- **Stage 8 follows the repository's test pattern** (the `@davna/jest` package in `config/jest`, the existing `src/**/__tests__/*.spec.ts` next to the code, and the fakes in `__fakes__/` or `fakes/`): cards in dependency order, one item per test, with the file path and the rule it covers, and the open points with a recommendation. Unit tests take their effects as fakes; a test that needs MongoDB or the `.env` is an integration test and says so.
- **While the tests are written,** each item is checked when its test goes in; a new test gets its item first; an item that stopped applying is struck through. The API that the tests fixed and the choices made while writing them go to a final section of the checklist.
- **The tests are the specification.** No test is weakened to pass; if one looks wrong, the user decides.
- **Every new `src/**/*.ts` file carries the MIT license header** (`yarn add:header`, from `docs/license.header.txt`).
- **What the feature implements leaves the manual procedures together with it,** never before: the documented command, the script and the text. Stage 4 says what leaves. A data change already applied in production is never edited; a new one is written.

---

The other processes: [Findings and decisions](findings-and-decisions.md), [Gates](gates.md), [Production procedures](production-procedures.md), [Pull requests](pull-requests.md), [Go-live](go-live.md), [Feature closing](feature-closing.md), [Parallel features](parallel-features.md), [Refactorings](refactoring.md) and [Improvements](improvements.md).
