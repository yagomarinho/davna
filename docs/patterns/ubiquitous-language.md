# Ubiquitous language

**Status:** Proposed on 2026-11-10, brought from the author's pattern catalog. It stays Proposed until the first refactoring creates the glossary and resolves the conflicts of "Open questions".

Each concept of the system has **one name**, the same in conversations with the user, in the docs, in the code, in the data, in the contracts and on screen, recorded in **a single glossary**. The names come from the user, who knows the business: the agent proposes, never creates.

## Problem

- **The same concept with different names.** The lead and suggestion capture is the package `@davna/costumers.insights` (with the typo "costumers"), the module `feedback` of `apps/client.app`, the routes `/feedback/lead` and `/feedback/suggestion`, and the removed package `@davna/feedback` that `apps/monolith.api` still imports. The audio service is `apps/multimedia.processing`, the SDK `@davna/ffmpeg.sdk` and the compose service `ffmpeg`.
- **The same word with different meanings.** "agent" is the `agent` actor type of `AuthContext` (a delegated or system actor acting for an account) and also the `Agent` vertex and the `agent` participant type of `classroom.management` (the AI teacher in a classroom).
- **Old names in new places.** `apps/monolith.api` imports `@davna/classroom`, which became `@davna/classroom.management`; the participant type `'costumer'` carries the package's typo into stored data.
- **No glossary.** Each module names its concepts on its own, and nothing joins them, nor the words the screen uses in Portuguese (`apps/client.app` is in pt-BR).

## Decision

| Rule                                   | How                                                                                                                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One glossary                           | by context (identity and access, classroom, usage and consumption, customer insights, multimedia), with the term, the name in the code, what appears on screen, what not to use and the meaning |
| The terms are the user's               | the agent proposes and asks, and never creates a domain term alone; a new term enters the glossary before it appears in a document, the code or the screen                                          |
| One concept, one name                  | the docs and the code are in English and use the same name; the screen uses its pt-BR word, recorded in the glossary; the data, the contracts, the socket events and the code use the code name |
| One word, one meaning per context      | a word with two meanings in the same context gets a new name for one of them                                                                                                                         |
| The name follows the concept           | when a concept changes or splits, the name changes in the same change; deferring only with a register item and a trigger, and the glossary marks the legacy name                                   |
| Born in stage 1                        | a feature's stage 1, or a refactoring's definition, lists the new or changed terms; the user accepts them with it, and the change's `/pull-request` takes them to the glossary                        |

## How it works

### The glossary

It lives in `docs/system/language.md`, next to the rest of the production picture: it holds the vocabulary of what is in production. Each change's `/pull-request` takes its terms to it, and `/architecture-survey` checks the whole glossary when it redoes the picture. Each context has a section with this table:

| Term        | In the code   | On screen | Do not use        | Meaning                                                    |
| ----------- | ------------- | --------- | ----------------- | ---------------------------------------------------------- |
| Classroom   | `classroom`   | _(the pt-BR word the screen uses)_ | conversation, chat | the space where a participant and the agent exchange messages (an illustration of the format, not an accepted term) |

- **"On screen"** is the word the interface uses; "—" when the term does not appear on screen.
- **Legacy names** live in a table of their own: the old name, where it still is, today's term and the register item that defers the change, with its trigger.
- **Technical terms** that are not the business's (a socket event, a collection) go into their context's section, with "—" on screen, so a word's ban on screen does not apply to them by mistake.

### The life of a term

1. **Born in the conversation.** The user uses a word, or the agent needs to name something new, proposes a name and asks.
2. **Enters the definition.** The feature's stage 1, or the refactoring's definition, has the table of new or changed terms, checked against the glossary. A term that already exists with another meaning is a conflict, resolved before the acceptance.
3. **Applies with the acceptance.** From then on, the docs, the code and the screen use the term.
4. **Reaches the glossary** by `/pull-request`, in the pull request that takes it to `main`.
5. **Changes by the user's decision.** The change in the code is a refactoring, or part of the feature that changed the concept.

### The check

`/architecture-survey` searches the code and the docs for the "Do not use" words of each context and for legacy names without a register item. What it finds is a finding for the user, and is never replaced in silence. `/pull-request` does not run this search: it only takes to the glossary the terms of the change in its pull request.

## How to use

- **The agent,** before writing a domain term, looks in the glossary and in the change's definition; if it is not there, it asks. It never replaces a user's term with one the user did not use.
- **In a feature,** stage 1 lists the terms, the next stages use them, and the code is born with the names of the "In the code" column.
- **In a naming refactoring,** the definition lists the swaps, the plan says where each name appears (code, collections, routes, socket events, Docker and compose names), and the swap goes in small steps, with the tests green ([Refactorings](../process/refactoring.md)).
- **On screen,** the word comes from the "On screen" column.

## Limits

- **The screen is in pt-BR, and the code and docs in English.** The translation is fixed, but it exists, and whoever reads both needs the glossary.
- **Legacy names cost.** Deferring a swap is accepted with a register item, but while the old name exists, it invites using the old concept. A name stored in data (a participant type, a collection name) needs a data migration to change.
- **The glossary does not replace the stages:** it says what each word means, not the business rules.

## Discarded alternatives

- **A glossary per feature:** it is stuck to the feature and diverges from the code.
- **The code in Portuguese:** the repository is already in English, and the screen's language is a choice of the app, not of the domain.

## Open questions

The answers the pattern still waits for from the user:

1. **Legacy names: defer or forbid.** Recommendation: defer only with a register item and a trigger. Forbidding would force every concept change to rename everything at once.
2. **Today's conflicts,** resolved one by one by the first refactoring, with the names coming from the user:

| Word                         | Where                                                                                                                                         | The conflict                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| agent                        | the `agent` actor type of `AuthContext` (`shared/core/src/application/contracts/auth.context.ts`); the `Agent` vertex and the `agent` participant type (`modules/classroom.management`) | two meanings                                     |
| costumer, costumers          | the package `@davna/costumers.insights` and the participant type `'costumer'` (`modules/classroom.management/src/entities/graph/vertices/participant.ts`) | a typo for "customer", already in stored data    |
| feedback, customer insights  | the client module `feedback`, the routes `/feedback/*`, the removed `@davna/feedback`, the package `costumers.insights`                        | one concept, several names                       |
| classroom                    | the removed package `@davna/classroom` still imported by `apps/monolith.api`; the package `@davna/classroom.management`                      | old name in new code                             |
| ffmpeg, multimedia           | the app `multimedia.processing`, the SDK `@davna/ffmpeg.sdk`, the compose service `ffmpeg`                                                   | the tool's name used for the service             |
| teacher, agent               | `apps/interaction.conductor/src/services/teacher.generates.response.ts` and the persona in its prompts; the `Agent` vertex                  | two names for the AI side of a classroom         |
| account, subject, principal  | `subject_id` in `AuthContext` and in `Participant`; `principal.account` in `AuthContext`                                                    | the relation between the terms is not written down |

## Where it is in the code

Not in the code yet: there is no glossary (`docs/system/language.md` is created by the first `/architecture-survey`). The closest today is the documentation in `shared/core/src/application/contracts/auth.context.ts`, which defines actor and principal, and the entity names registered in `EntityURItoKind` by each vertex and edge of `modules/classroom.management/src/entities/graph/`.

## Known deviations

- The conflicts of the table above.
- Comments in Portuguese remain in a few files (e.g. the size validator note in `modules/classroom.management/src/dtos/input/upload.audio.dto.ts` and `apps/multimedia.processing/src/utils/file.guard.ts`), against the rule that code comments are in English.
