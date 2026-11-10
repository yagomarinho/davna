# Errors by layer

**Status:** Proposed on 2026-11-10, brought from the author's pattern catalog.

Every error of the system is an `AppError` of one of four layers, with a name, a stable code, safe details and a chained cause, written as data, without classes.

---

## Problem

- Each module, handler and provider describes its errors its own way, without saying which layer they come from: today a service returns `Left({ status: 'error', message })`, a DTO validator returns `Left({ errors, message })`, and a handler chooses the HTTP status by hand.
- The message is the only identity of an error, so a test, a log or a client can only match it by text, and changing a word breaks them.
- A defect only infrastructure sees, such as a graph vertex whose edge is missing, comes out as a generic error, or worse, as "not found".

## Decision

- **The hierarchy, as types:** `AppError` is the base interface; `ApplicationError`, `DomainError`, `InfraError` and `InterfaceError` extend it with `interface … extends`, fixing the layer; each named error extends its layer's interface.
- **No classes, anywhere:** errors are immutable records with a `_tag`, created by functions and returned on the `Left` side of an `Either`, like the rest of the functional core ([Readable functional style](functional-style.md)). What a library throws is caught at the edge and becomes data.
- **The layer is the one that detects it,** in its role: the edge (the request, the DTO, the credential, the screen) is interface; the rules and the authorization, domain; the adapters (MongoDB, the storage, OpenAI, Firebase, the media service), infrastructure; the service and the apps' composition, application.
- **The code** is `<layer>.<module>.<name in snake_case>`, derived from the error, and it is the name of its log.

## How it works

```ts
export interface ClassroomNotFound extends DomainError<'ClassroomNotFound'> {}
export const classroomNotFound: ClassroomNotFound = domainError(
  'classroom',
  'ClassroomNotFound',
)
```

- A `codeOf` gives the code (`domain.classroom.classroom_not_found`); a `wrap` wraps an error in an upper layer, with the lower one as its cause; an `unexpected` gives the layer's unexpected error, with the caught exception (`fromThrown`: the class and the stack without its first line, never the message, which may carry data).
- Each handler translates the error into the public status and body by a total `switch` on the `_tag`; the public contracts do not change because of the hierarchy.
- `Failure` (`shared/core/src/application/use.cases/failure.ts`) becomes the `AppError` base, or is replaced by it, in a refactoring.

## How to use

- **A new error:** the interface that extends its layer and the constant created by the function.
- **An error that goes up:** returned as it is when its meaning does not change; wrapped with `wrap` when it does.
- **What infrastructure finds and the domain could not foresee** (a missing part of an aggregate, a dangling edge) is an `InfraError` that says which aggregate, which part and what was expected, by ids, never a "not found".
- **Safe details only:** ids, counts and codes; never message content, personal data or secrets.

## Limits

- The stack only exists on the server; in the browser, the error carries its code and layer.
- The public body of the APIs stays as it is today; carrying the new code into the response body is a new contract, decided in a feature.

## Discarded alternatives

- **Classes (`class AppError extends Error`):** they would give `instanceof` and the stack for free, but would bring classes into the domain and lose the serializable shape of errors.
- **Codes as loose strings, without the layer:** they say neither who detected the error nor whether retrying makes sense.

## Where it is in the code

Not in the code yet. The closest today:

- `shared/core/src/application/use.cases/failure.ts` (`Failure { message, data? }`) and `outcome.ts` (`ServiceOutcome`, the `Either<Failure, A>` a service returns);
- `shared/application/src/v2/contracts/error.handler.ts` (`ErrorHandler`), in the unexported v2 of the HTTP adapter.

## Known deviations

- **Ad hoc failures.** Services return `Left({ status: 'error', message })` with free text (e.g. `modules/classroom.management/src/services/usage/authorize.consumption.ts`), DTO validators return `Left({ errors, message })` (e.g. `modules/classroom.management/src/dtos/input/upload.audio.dto.ts`), and the shapes differ between modules.
- **Status chosen in the handler, by text.** `appendMessageHandler` returns 400 or 401 per branch and forwards `value.message`, sometimes through `as any`.
- **Exceptions rethrown.** The DTO validators rethrow anything that is not a yup `ValidationError`, and the HTTP adapter decides what the client sees.
