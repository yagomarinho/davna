# @davna/core

The functional and DDD foundation every module and app builds on, with no framework. Source-only: `main` is `index.ts`, which re-exports `src/`, in three parts:

- `src/kernel/`: `Either` (`Left`, `Right`, `isLeft`, `isRight`), `Reader`, `ReaderTask`, `uid` and `timestamp`.
- `src/domain/`: `Entity<Props, Tag, Version>` with `meta` and `props`, `createEntity`, `DraftEntity`, value objects, and the compositions `Tag`, `Versioned`, `Buildable`, `Identifiable`, `Audited`, `Timestamped`, `Idempotent` (`_idempotency_key` in the meta), `Upgradable` and `Resource` (`_r`); entities register themselves in `EntityURItoKind` (`src/domain/types/registry.ts`) by declaration merging.
- `src/application/`: the contracts `AuthContext` (actor `account` or `agent`, plus the principal), `OperationResult` and `Resolvable`; the ports `Handler` (`request => env => Response`), `Request`, `Response` and `Next`; the pipeline `Middleware` and `Postprocessor`; the use case `Service<Data, Env, Result>` (a Reader that resolves to an `Either`), `Failure` and `Outcome`; the `Repository` built from capabilities (`readable`, `writable`, `queryable`, `deletable`, `batchable`), its read-only and write-only modes, the query builder (`QueryBuilder`, `where`, `filter`, `sort`, `range`) and batches; and the transactions `UnitOfWork`, `UnitOfWorkSaga` (compensations run in reverse order) and `SagaRepositoryProxy`.

```bash
yarn tsc -p shared/core --noEmit   # no package script; the root `yarn typecheck` covers it too
```

- **No tests and no `test` script.** Every module relies on these contracts, so any change here starts by writing characterization tests for the behavior it touches, as the safety net (`docs/recommendations.md` RG13). `jest.config.ts` already re-exports `@davna/jest`.
- **Cycle with `@davna/kernel`:** this package imports `@davna/kernel` (`applyEntry` and the shared types), and `@davna/kernel`'s `src/entities/id.ts` imports this package back (RG04). Do not deepen it: nothing here may depend on something that depends on `@davna/core`.
- Four files import the package by its own name (`from '@davna/core'` in `src/application/contracts/auth.context.ts`, `src/application/repository/batch/batch.result.ts`, `src/application/transactions/unit.of.work.saga.ts`, `src/domain/base/meta.ts`). That only resolves through the workspace link and invites load-order surprises; inside the package, import by relative path.
- The `kernel/` folder here is not `@davna/kernel`; the two names collide (RG04).
- `Route` is not exported here; it belongs to `@davna/application`.
- `@davna/core` is declared as a dependency only by the root, `kernel`, `application` and `infra`; the modules use it through hoisting (RG15). A package that imports it should declare it.
- This is the layer where the functional style and the errors-as-data patterns land first (`docs/patterns/functional-style.md`, `docs/patterns/errors.md`, both proposed); a new combinator or error type enters with its test written red first.
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.
