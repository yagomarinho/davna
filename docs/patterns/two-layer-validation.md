# Two-layer validation

**Status:** Proposed on 2026-11-10, brought from the author's pattern catalog.

## Problem

A value is written by one process and used by another, in another app or on another machine, and using it wrong is costly or unsafe. In davna, an audio is received and validated by `apps/monolith.api` (through `classroom.management`), then sent to `apps/multimedia.processing` for its metadata and conversion; a message is appended by the API and later read by the agent's side to generate the answer. Validating only on write trusts a database or a caller that a manual step, an old client or another app may change; validating only on read lets the writer discover the error only when the reader already failed.

## Decision

The same value is validated twice, by the same rules:

- **on write,** by the domain ([Business rules in the domain](business-rules.md)), with every problem together and messages for whoever sent it;
- **on read,** by whoever uses the value, before the effect; refused, the use fails closed (the media service refuses the file with an interface error, the agent's side skips the message with a recorded reason).

The rules live in one place, not in duplicated code: a schema or a rules document exported by the package that owns the concept, which both sides import or read. When both sides cannot share code (another language, another deploy), the rules are a data document with **vectors** (the accept and refuse cases) that each side reads and tests, and each side has a test that gives the same result for every case.

## How it works

1. The domain validates and writes.
2. Whoever reads validates again by the same rules.
3. The rules (and the vectors, when there are any) are the contract: changing a rule changes the rules, the vectors and both sides in the same commit, and the pipeline of each side watches the folder of the rules ([Path-filtered pipelines](ci-triggers.md)).
4. The cases where the two sides could diverge (a MIME type with parameters, such as `audio/webm; codecs=opus`, a size at the limit) enter the vectors on purpose.

## How to use

- Use it when the value crosses an app or process boundary and using it wrong has a cost (money, security, a service that fails).
- Write the rules and the vectors before both validators, with their tests.
- The read-side validator refuses what it does not know (a new type, a key outside the list): fail closed.

## Limits

- It does not serve rules that depend on state (uniqueness, the current version): those stay in the domain and the database.
- Two validators cost maintenance; the test over the shared rules is what keeps them from diverging.

## Discarded alternatives

- **Generating one side's validator from the other's:** it couples the builds and hides where the two diverge.
- **Validating only on write:** the reader would trust data that a manual step or another writer may change.
- **Validating only on read:** the writer would see the error only when the reader already failed.

## Where it is in the code

Not in the code yet. The closest today:

- **Write side:** `modules/classroom.management/src/dtos/input/upload.audio.dto.ts` (`uploadValidation`), which restricts the MIME type to `SUPPORTED_MIME_TYPE` (`modules/classroom.management/src/entities/graph/vertices/audio.ts`).
- **Read side:** `apps/multimedia.processing/src/utils/file.guard.ts` (`fileGuard`), the `validate` of its `/metadata` and `/convert` routes.

## Known deviations

- **Duplicated, divergent schemas.** `fileGuard` is a copy of the upload schema, not the same rules: it accepts any MIME type (`string().required()`), while the write side accepts only `SUPPORTED_MIME_TYPE`.
- **No size limit on either side.** Both schemas carry a note that a size validator is still to be added.
- **No shared rules or vectors,** so nothing tests that the two sides agree.
