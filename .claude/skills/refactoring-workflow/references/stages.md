# The four stages

Each document is written in English, in the refactoring's folder, from the templates in `templates/`. A refactoring covers only what it changes: the features' stages still apply, and are cited by feature, stage and section, never copied.

## For every stage

- **Start from the previous stage, accepted.** Read it, and read what the refactoring touches in the features' stages, so you cite them instead of repeating them.
- **Show the facts.** A reason, an inventory or a risk names where it is (files, packages, collections, ids) and how you found it (the command or the query).
- **Cite the source of every rule** by id, and the features by stage and section.
- **End with the open decisions** the stage leaves to the next one, each with a recommendation. The user decides them; that is what acceptance is.
- **Record the acceptance in the document itself:** "**Accepted by the user on YYYY-MM-DD,**" (the safety net: "**Approved**"), and any answer that changes what was written.
- **Keep the `CLAUDE.md` files current** when the refactoring changes how the repo works (a package, a rule, a command, a convention, a trap), with the change itself, when it lands. Its state and history stay in the refactoring's folder, never in a `CLAUDE.md`.

## What each stage must contain

| Stage          | Contains                                                                                                                                     | Check before asking for acceptance                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Definition  | the reason, with the facts; what changes; the invariants; scope and out of scope; the repository items taken; the term table; the risks; the id prefix | the change keeps the behavior (`docs/process/refactoring.md`, section 1); every invariant is observable by a test, a contract or a screen; every term comes from the user, or is marked as a proposal |
| 2. Plan        | the inventory, with counts; the steps in order, each small and ending green; the data and the contracts; the deploy; the way back            | the inventory comes from searches you ran, with the commands written down; every occurrence belongs to a step; a data change that isn't additive names its window or its expand-and-contract        |
| 3. Safety net  | what already covers each invariant; the characterization tests to write; the checks outside the test suites; the open points               | every invariant has at least one test; every step of the plan is covered by a test or a check                                                                                                        |
| 4. Execution   | the baseline; the steps from the plan, ticked with dates; the checks before the merge; the go-live                                           | nothing: it is kept current as the work lands                                                                                                                                                        |

## The definition in particular

- **The invariants are the contract of the refactoring.** Write them as observable facts: "the DTOs keep the same fields and values", "the HTTP routes and socket events keep their names and payloads", "the client shows the same screens", "the documents in each collection keep the same shape". A vague invariant ("nothing changes") can't be checked.
- **The extension points** that projects building on davna consume are invariants unless the user decides otherwise; a rename of one is a breaking change of a public contract, and that decision is the user's.
- **The term table** follows `docs/patterns/ubiquitous-language.md`: today's term, the new one, the name in the code, the word on screen, the words not to use, and why. A conflict with the glossary (`docs/system/language.md`, once it exists) is resolved before acceptance.
- **The out of scope** says what looks related but stays: the behavior changes the refactoring found (each one a feature or a fix), and the renames deferred to a register item.

## The plan in particular

- **Search, don't remember.** The inventory is built from `git grep -n -w '<name>'` over the repo and from read-only queries against the local Mongo of `docker-compose.yml` (`references/execution.md`), never from memory or from the stages alone. Remember the places `git grep` reaches but code search tools may skip: `Dockerfile`s, `docker-compose*.yml`, `.env.example` files (names only), `tsconfig.json` references, the `workspaces` of `package.json`, `scripts/`, `__github__example/` and the draw.io files of `docs/project/`.
- **Order the steps so each one compiles and passes:** usually the domain and its tests, then the repositories and the data, then the apps, then the client, then the images and compose files, then the docs.
- **The data:** a rename is not additive, because the running code reads the old name until the new code ships. Choose, and write down, either a maintenance window or an expand-and-contract in two deploys (the code reads both names, or a new entity version `_v` with an upgrade on read; the documents rewritten by a backfill; the old name dropped in the "After" group). Versioned migration scripts are not available yet (`docs/recommendations.md`, RG11), so each data step is a production procedure.
- **A package rename** (folder and `@davna/<name>`) touches the `workspaces`, every importing `package.json`, the root `tsconfig.json` references, the Dockerfiles that copy the folder and `yarn.lock`; plan `yarn install` in the step and never edit the lock by hand.
- **The way back** is written per step, and for after the deploy.
