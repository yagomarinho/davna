# Business rules in the domain

**Status:** Proposed on 2026-11-10, brought from the author's pattern catalog.

Deciding a business rule is the domain's job, and that is non-negotiable: pure functions, with no I/O, tested in Jest. MongoDB, the storage, the AI and media providers, Express and the other infrastructure layers only deliver facts, execute what the domain decided and give support with light validations. That is what the architecture is for: a functional core that decides and an imperative shell that executes.

## Problem

- **The same rule in two places diverges.** A rule in a MongoDB query filter and in the code, or in a handler and in a service, stops having an owner, and it is no longer clear which one applies.
- **A rule hidden in infrastructure has no unit test.** What lives in a query is only tested against a real database (or a fake that reimplements it); in the domain, the same rule is a pure function, tested in Jest.
- **A refusal born in infrastructure arrives translated far from its cause:** a MongoDB driver error or an SDK exception, at risk of becoming the wrong error (a 500 instead of a 404).
- **A rule hidden in a query, a middleware or a handler** does not show to whoever reads the use case.
- **A rule in a component** (a form validation only in the browser) can be bypassed by whoever calls the API directly.

## Decision

- **A business rule belongs to the domain, without exception.** Who may do what, in which state, with which transitions, within which product limits (a participant's entitlement, the usage policies and the remaining consumption, the tolerance of an audio duration, what a valid message is): all of this is decided by pure functions (policies and deciders), which services and handlers call before touching the resource.
- **Infrastructure gives support,** and only does what is its own:
  - **integrity:** unique indexes and `$jsonSchema` validators on the collections;
  - **concurrency:** the races only the database sees, such as uniqueness and the idempotency key;
  - **security:** the API key and the authentication middlewares as the first barrier, the database user's permissions as the second;
  - **cheap safety nets:** a validator on a length or a closed list, which the domain still checks;
  - **the infrastructure's own data:** creation dates and ids set by the database.
- **One source per rule.** The refusal the user sees (the error, the 4xx, the form message) comes from the domain.

| Question                                                                                                | If yes                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Is it a rule the business would state (who may, when, in which state, which transition, which limit)? | domain                                                              |
| Can two simultaneous requests break the rule?                                                           | the domain decides, and the database holds the race with a unique index |
| Is it data integrity (the reference exists, has the right type)?                                        | the domain checks it with facts the repository delivers; an index or validator as support |
| Is it security or authentication?                                                                       | the middlewares first, the database's permissions second            |
| Is it a storage or format limit, cheap to check?                                                        | the database as a safety net; the domain still validates            |
| Is it how to talk to a provider (authentication, pagination, request format)?                          | the provider's client in `shared/infra`                             |

## How it works

- **Facts, not decisions:** when the domain needs data to decide, the repository or the provider delivers facts, and the domain decides. The service reads the participant, its grants, the entitlement, the policies and the usages; a pure function decides whether the requested consumption fits.
- **Races:** when concurrency can break a rule, the domain still decides, and MongoDB holds the race with a unique index or the idempotency key (`Idempotent` in `@davna/core`). The repository translates the driver's duplicate-key error into the domain's error by the index's stable name.
- **Repeated validation:** infrastructure may repeat a domain limit as a safety net (a `$jsonSchema` length, the browser's form validation for fast feedback). But it is never the only place of the limit, and the error the user sees never depends on it.
- **Time is a parameter:** a rule that depends on "now" (an expiry, a daily or weekly window) receives the current date by parameter, so the test fixes it.

## How to use

1. **New rule:** write it in the domain, as a pure function, starting from the tests (TDD), before thinking of the database or the provider.
2. **Where it lives:** in the module, next to its entities (`modules/<module>/src/`), in a file with no imports from `shared/infra` and no repository calls; the service gathers the facts and calls it. When more than one module needs it, it goes to a shared package by a refactoring.
3. **Race:** ask whether the rule has a race. If it does, add the index that holds it, with a stable name, and the error translation.
4. **New mechanism in the database:** an index, a validator or a database-side script only exists for integrity, concurrency, security or the database's own data. Its comment (or the migration script that creates it) says which guarantee it gives.
5. **Query with a filter:** the filter stays, for efficiency, and the domain checks the same criterion on what came back. A comment says the filter is only support.
6. **Specification:** each feature's data model stage has a section "who guarantees what" (database and domain, or providers and domain).

## Limits

- **Administrative procedures** (a script run by whoever operates the database) do not go through the domain. They are versioned and reviewed scripts, run by the user, and they go away when the feature that replaces them arrives.
- **Accepted races:** a domain decision may age between reading the facts and writing. That is accepted when the result is harmless. When it is not, the race goes to the database.
- **A provider's data format** (the shape of a spreadsheet range, an OpenAI response) is not a business rule: it is a contract with the provider, and it lives in its client.
- **Presentation rules** (visual order, truncating a text) may stay in the component, as long as they do not decide what the user can see or do.

## Discarded alternatives

- **Rules in queries, middlewares or database-side logic:** they duplicate the domain, have no unit test and return translated errors.
- **Everything in the domain, without indexes:** two simultaneous requests would break uniqueness rules, because only the database sees the race.
- **Trusting the provider's filter:** the filter becomes the rule, without a test, and disappears in the first query that does not repeat it.
- **Rules in components:** the browser can be bypassed, and a component has no easy unit test.

## Where it is in the code

| Side                     | Where                                                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain (closest today)   | `modules/classroom.management/src/utils/check.duration.tolerance.ts` (`checkDurationTolerance`, a pure decision on an audio's duration) and `modules/classroom.management/src/helpers/remaining.consumption.ts` |
| Services that gather facts | `modules/*/src/services/` (`Service<Data, Env, Result>` from `@davna/core`), e.g. `modules/classroom.management/src/services/usage/authorize.consumption.ts`                                   |
| Translation              | not in the code yet: errors leave services as `Left({ status, message })` objects ([Errors by layer](errors.md))                                                                                 |
| Support                  | `shared/infra/src/repositories/` (`MongoRepository`, `FederatedRepository`); `shared/infra/src/middlewares/` (`apiKeyAuthorization`, `guardian`); no index or validator is declared in the code yet |

## Known deviations

- **Decision mixed with I/O.** `authorizeConsumption` reads the repository and decides the remaining consumption in the same function; the comparison `consumption + requested_consumption >= maxConsumption` and the aggregation windows are not a pure, separately tested decider.
- **Time read inside the rule.** `authorizeConsumption` calls `new Date()` for the grant's expiry and for the daily, weekly and monthly windows, instead of receiving "now" by parameter.
- **A product limit as a literal.** `remainingConsumption` hard-codes one hour (`60 * 60 * 1000`) as the limit, outside the usage policies.
- **Rules in handlers.** `appendMessageHandler` compares the presigned URL and chooses the HTTP status for each refusal inline, instead of calling a decider that returns a domain error.
- **No unique indexes or validators** are declared for the collections, so races (a second participant for the same subject, a repeated idempotency key) are held by nothing.
