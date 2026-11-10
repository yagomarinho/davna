# @davna/infra

The concrete adapters behind the `@davna/core` ports. Source-only: `main` is `index.ts`, and `src/index.ts` re-exports three folders:

- `src/middlewares/`: `apiKeyAuthorization` (reads the header named by `config.auth.apiKey.headerName`, expects `apikey=<token>`, answers 401 otherwise) and `guardian` (runs the route env's `validate` and answers its `Left` with the env's `onLeft` or a default 400).
- `src/providers/`: `Auth` with `FirebaseAdminAuth`; `GPTModel` (`respond`, `transcribe`, `synthesize`) with `ChatGPT` (OpenAI) and `FakeAI`; `Signer` with `JWTSigner`; `Storage` with `STORAGE_TYPE`, `AWSS3Storage` and `MongoDBStorage` (GridFS).
- `src/repositories/`: `MongoRepository`, `InMemoryRepository`, `GoogleSheetsRepository` and `FederatedRepository`, which aggregates several repositories into one graph and keeps their ids in step through an `IDContext`.

```bash
yarn workspace @davna/infra test                # every spec, with --experimental-vm-modules
yarn workspace @davna/infra test:middlewares
yarn workspace @davna/infra test:providers
yarn workspace @davna/infra test:repositories   # includes the integration specs below
yarn tsc -p shared/infra --noEmit               # no package script
```

- **Integration specs.** `src/repositories/__tests__/mongodb.repository.spec.ts` connects to `MONGODB_DEFAULT_CONNECT_URI` (or a local Mongo) and **clears** its collection: run it only against a local database, such as the `mongo` service of `docker-compose.yml`. `google.sheets.repository.spec.ts` appends a row to the spreadsheet named by `GCP_LEAD_SPREADSHEET_ID` with the `GCP_*` credentials and then removes it: never point it at a spreadsheet that holds real data. Both read the root `.env` through `@davna/jest`; the user fills it, the agent only checks variable names. The other specs use fakes (`src/repositories/__tests__/fakes/`, a mocked `openai`).
- The test scripts set `NODE_OPTIONS` with POSIX syntax (`NODE_OPTIONS="$NODE_OPTIONS ..." jest`). Yarn 1 runs scripts with `cmd.exe` on Windows by default, where that syntax fails; there they work only in a POSIX environment such as WSL.
- **Configuration read inside the package:** `ChatGPT` defaults its key to `OPENAI_API_KEY`, and `firebase.admin.app.ts` builds default credentials from the `FIREBASE_ADMIN_*` variables, falling back to empty strings (`docs/recommendations.md` RG05). New code takes every value by parameter from the app that composes it; never add a new `process.env` read or a fallback value here.
- The package is an adapter layer: no business rule lives here (`docs/patterns/business-rules.md`). A repository persists and queries; deciding what to persist belongs to the module's services.
- The package does not export the driver's `MongoClient` (`apps/monolith.api` imports it from here and does not compile, RG01); a repository opens its own connection with `infra.connect()`.
- The code imports `@davna/core` (most files) but `package.json` declares only `@davna/kernel` among the internal packages (RG15).
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.
