# @davna/classroom.management

The product's core context: classrooms, their participants, messages, audio and usage, modeled as a **graph** and persisted through `ClassroomFedRepository` (`src/repositories/classroom.federated.repository.ts`), a `FederatedRepository` of `@davna/infra` over one MongoDB repository per vertex and edge. Source-only: `main` is `index.ts`, and `src/index.ts` exports `dtos`, `entities`, `handlers`, `providers`, `repositories` and `utils` (the services are internal).

- Vertices (`src/entities/graph/vertices/`): `Agent`, `Audio`, `Classroom`, `Message`, `Participant`, `Text`, `Entitlement`, `UsagePolicy`.
- Edges (`src/entities/graph/edges/`): `OccursIn`, `Ownership`, `Participation`, `Representation`, `Source`, `Usage`, `Granted`, `PolicyAggregate`.
- Handlers (`src/handlers/`): `createPresignedAudioHandler`, `downloadAudioHandler`, `openClassroomHandler`, `showClassroomHandler`, `appendMessageHandler`, `fetchClassroomHistoryHandler`, `fetchUnprocessedMessagesHandler`, `storeDerivedContentsHandler`, `checkMaxEstimatedConsumptionHandler`; DTOs `uploadValidation` and `downloadValidation` (yup) and the `*DTOFromGraph` mappers.
- Ports (`src/providers/`): `MultimediaProvider` (`metadata`, `convert`) and `Scheduler` (`schedule(command)`), implemented by the app that composes the module.

```bash
yarn workspace @davna/classroom.management test
yarn workspace @davna/classroom.management test:handlers
yarn workspace @davna/classroom.management test:services
yarn tsc -p modules/classroom.management --noEmit   # no package script
yarn test:modules                                   # from the root: every module's tests, with a summary
```

- **The public surface is `src/index.ts`.** Nothing outside the module imports a deep path (`@davna/classroom.management/src/...`); a service another package needs is reached through a handler, or exported on purpose in a change that says so. The handlers are also the contract the agent's reply orchestrator is meant to call (`fetchUnprocessedMessages`, `appendMessage`, `storeDerivedContents`, `checkMaxEstimatedConsumption`), with the `agent` actor of `AuthContext` (`docs/recommendations.md` RG02); changing their data, metadata or response shape is a contract change.
- Handlers read who acts from `metadata.auth` (`AuthContext`: `actor.subject_id`, `principal.account.id`) and the route params from `metadata.params`; the app's authentication middleware fills `auth`.
- `appendMessageHandler` runs its writes inside a `UnitOfWorkSaga` with `SagaRepositoryProxy` (`@davna/core`): every write registers its compensation, and a failure rolls back in reverse order. A new write in that flow goes through the proxy, never the plain repository.
- **Usage and entitlements** (`Entitlement`, `UsagePolicy`, `Granted`, `PolicyAggregate`, `Usage`, `src/services/usage/authorize.consumption.ts`) decide how much a participant may consume: the limits are data in those entities, and the rule that applies them is in `authorizeConsumption`, tested in `src/services/usage/__tests__/`.
- `src/helpers/` (`Emitter`, an empty stub, and `remainingConsumption`, a literal one-hour limit) is imported by nothing and not exported; do not build on it.
- **Configuration read inside the module** (RG05): every vertex and edge repository reads `MONGODB_<NAME>_CONNECT_URI`, `MONGODB_<NAME>_DATABASE` and `MONGODB_<NAME>_COLLECTION` with fallbacks (`mongodb://localhost:27017`, `db`, a default collection); `src/utils/storage.ts` builds the storage drivers from `AWS_S3_*`, `MONGODB_DEFAULT_CONNECT_URI` and `MONGODB_STORAGE_*`; `src/services/audio/persist.audio.ts` builds the audio URL from `API_BASE_URL`. New code receives these values by parameter. Collection names are a contract with production data; renaming one is a production procedure.
- `package.json` declares `@davna/infra` and `@davna/kernel`; the code imports `@davna/core` most of all (RG15).

## Rules

- The module never imports another module; it depends only on `@davna/core`, `@davna/infra` and `@davna/kernel`.
- Business rules live in the services (`Service`, returning an `Either`), tested with fakes; handlers call services in order and map each `Left` to a `Response` with its status (`docs/patterns/business-rules.md`, `docs/patterns/functional-style.md`).
- A new vertex or edge follows the existing ones: `create<Name>` with its URI and version, its `EntityURItoKind` entry, its Mongo converter and repository, and its place in the `Edges` or `Vertices` union of `ClassroomFedRepository`.
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.

## Tests

- Services run against `ClassroomFedFake` (`src/services/__fakes__/classroom.fed.fake.ts`, a `FederatedRepository` over `InMemoryRepository`s) and `id.context.fake.ts`; no database runs.
- Handler specs mock their services with `jest.mock` and assert on the calls and the `Response`.
- `persist.audio.spec.ts` sets `process.env.API_BASE_URL` itself; keep any new environment-dependent test that explicit.
