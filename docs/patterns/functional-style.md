# Readable functional style

**Status:** Proposed on 2026-11-10, brought from the author's pattern catalog and adapted to the functional kernel davna already has in `@davna/core` (`Either`, `Reader`, `ReaderTask`, `Service`, `Handler`).

A use case reads from top to bottom, as a list of named steps. Each step goes on with its value or stops with a reason, the failure travels on the `Left` side of an `Either`, and the chain ends in a fold that builds the `Response`. Inside a chain there are only names.

---

## Problem

- **The `if (isLeft(...)) return` ladder.** A handler calls a service, checks `isLeft`, builds a `Response` with a status, calls the next service, checks again: `appendMessageHandler` repeats this for every step, and the reader has to scan each branch to know what the use case does.
- **Decision and effect in the same function.** A service reads the repository, computes, decides and builds the failure in one body (`authorizeConsumption`), so the decision has no test of its own and the effect cannot be swapped.
- **Anonymous logic in the middle.** Inline object literals, ternaries and `reduce` callbacks inside a service body have to be executed in the reader's head to know what the step does.
- **No verbs for the mechanics.** `Either` has only `Left`, `Right`, `isLeft` and `isRight`, so every composition is written by hand.

## Decision

### The failure on the `Left` side, and the fold at the end

- **Each step returns an `Either`** (or a `ServiceOutcome`, the `Reader`/`ReaderTask` over an `Either` that `Service` already returns): `Right` goes on with its value, `Left` stops with a reason. The reason is what the chain would return in that case: a typed [error](errors.md).
- **The log stays in the step where the fact happens,** not in the fold, so the order of the logs does not depend on how the chain ends.
- **The chain ends in a total fold:** one function that turns every `Left` and the final `Right` into the handler's `Response`, with one status per error tag.
- **A linear chain uses a pipe; a step that needs the values of earlier steps uses a named function** that receives them, or a small generator-based helper if the kernel adopts one.

### Only names in a chain

Each element of a chain is the name of a step, a kernel verb or the partial application of a named function. No lambda, not even a trivial one:

```ts
// the participant must be in the classroom before a message is appended
const appendToClassroom = (input: AppendInput) =>
  pipe(
    readParticipant(input.subjectId),
    flatMap(requireParticipation(input.classroomId)),
    flatMap(requireAudioOwnedBy(input.audio)),
    flatMap(appendMessage(input)),
  )
```

Each line is a sentence: read the participant; require that it takes part in the classroom; require that it owns the audio; append the message. (`pipe`, `flatMap` and the steps are the shape this pattern asks for; they do not exist in `@davna/core` yet.)

### The chain's verbs

The kernel gets one verb per mechanic that repeats, named for what it does, for `Either` and for `ServiceOutcome`: `map`, `flatMap`, `mapLeft`, `as`, `fold`, and a `pipe`. A new verb enters the kernel by the rule of three: a pattern that repeats in three places, or in two packages, with no business rule, with the red test first.

### The decision is pure and stays out of the effect

A ternary or a `switch` that chooses the next value becomes a pure, named function, outside the chain. The effect step only calls it:

```ts
// the consumption after the request must stay under every policy's maximum
const exceedingPolicies = (requested: number) => (applied: AppliedPolicy[]) =>
  applied.filter(p => p.consumption + requested >= p.maxConsumption)
```

The pure function receives the context first and the chain's value last, so it enters the pipe as a partial application.

## How to use

1. **Name the steps for what they do,** with the glossary's terms (`docs/system/language.md`): `readParticipant`, `requireParticipation`, `appendMessage`. The verb says the effect: `read`, `require`, `build`, `append`, `store`, `record`.
2. **Write each step as an `Either<Reason, Value>`:** the value that goes on and the reason that stops.
3. **Take the logic out of the chain:** the decision goes into a pure, named function; the mechanics, into a kernel verb.
4. **End in a fold** that builds the `Response`, and check that the handler keeps its signature (`Handler<Env, Data, Metadata>`).
5. **Packages without tests** (`shared/core`) get their net first: the verbs land with their tests, before any handler uses them.

## Limits

- **The bodies of repository and transaction callbacks** (`UnitOfWorkSaga`, `SagaRepositoryProxy`) stay as they are: they are the body of a transaction, not a step of a chain, and they live inside a named function.
- **List functions** (`messages.find`, `policies.map`) inside a named function stay as they are: they are not chain steps.
- **React components** in `apps/client.app` follow React's own idioms; this pattern applies to their pure logic and services, not to JSX.

## Discarded alternatives

- **A functional library (Effect, fp-ts):** davna already has its own kernel in `@davna/core`, and fewer dependencies keep it easier to read and to fork.
- **Exceptions for the expected failures:** they hide the reason from the type and from the reader, and `Service` already models failure without throwing.

## Where it is in the code

- **The kernel:** `shared/core/src/kernel/fp/` (`either.ts`, `reader.ts`, `reader.task.ts`) and `shared/core/src/application/use.cases/` (`Service`, `ServiceOutcome`, `Failure`).
- **The handlers and their pipeline:** `shared/core/src/application/ports/handler.ts` and `shared/application/src/v1/helpers/handler.pipe.ts` (`handlerPipe(...middlewares, handler)`).
- **The services and handlers of the modules:** `modules/*/src/services/` and `modules/*/src/handlers/`.

## Known deviations

- **No composition verbs.** `either.ts` exports only `Left`, `Right`, `Either`, `isLeft` and `isRight`; there is no `pipe`, `map`, `flatMap` or `fold`.
- **The ladder.** `modules/classroom.management/src/handlers/message/append.message.handler.ts` chains a dozen `if (isLeft(...)) return Response(...)` blocks, with the status chosen inline in each one.
- **Decision inside the effect.** `modules/classroom.management/src/services/usage/authorize.consumption.ts` decides the remaining consumption inside the service that reads the repository ([Business rules in the domain](business-rules.md)).
- **`shared/core` has no tests,** so the kernel the pattern builds on has no safety net yet.
