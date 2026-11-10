# @davna/monolith.api

The HTTP and WebSocket API (Express 5 through `@davna/application`, plus socket.io, port 3333) that composes the modules into one process. `src/index.ts` loads the root `.env`, builds the `Env` (`src/app/env.ts`, from `src/config/index.ts`), mounts the routes of `src/app/routes.ts` and attaches the socket.io server of `src/app/create.ws.server.ts`. Deployed as a Docker image (`Dockerfile`) run by `docker-compose.prod.yml` on a server; the deploy is manual today (`docs/recommendations.md` RG14).

```bash
yarn workspace @davna/monolith.api dev         # ts-node-dev with respawn, src/index.ts
yarn workspace @davna/monolith.api typecheck   # tsc over tsconfig.build.json (specs excluded)
yarn workspace @davna/monolith.api build       # rimraf dist, typecheck, then build.js (esbuild: one minified CJS bundle, dist/index.js, target node20)
yarn workspace @davna/monolith.api start       # node dist/index.js
yarn workspace @davna/monolith.api test        # jest --detectOpenHandles
yarn api:up                                    # from the root: docker compose up (mongo, media service, API); see RG03
```

- **It does not compile today** (RG01): `src/app/env.ts`, `create.ws.server.ts`, `multimedia.ts` and `src/__tests__/` import the removed packages `@davna/classroom` and `@davna/feedback`, a deep path (`@davna/classroom/src/services/show.classroom`) and handlers that no longer exist (`createClassroomHandler`, `uploadAudioHandler`, `appendAndReplyHandler`, `connectToClassroomHandler`); `routes.ts` imports those handlers from `@davna/classroom.management`, `env.ts` imports `MongoClient` from `@davna/infra` (not exported) and calls the repositories' older `connect()` API, and `resolve.account.role.names.ts` uses `Query.where` and `roles.query`, which the current `@davna/core` repository does not offer. The fix is a refactoring with the app tests as its safety net, not a patch here and there; until it lands, `yarn typecheck`, `build`, `test` and the image are red.
- **The generative reply** (the `classroom:welcome` and `classroom:append-message` socket events, which used to call the AI provider) is the boundary with `apps/interaction.conductor` (RG02): do not rebuild it inside the API without that decision.
- **Routes** (`src/app/routes.ts`): `POST /feedback/lead`, `POST /feedback/suggestion`, `GET`/`POST`/`DELETE /session`, `GET /session/refresh`, `GET /audio/:id`, `POST /audio` (multipart field `file`, read by `multer` in `src/app/app.ts`), `POST /classroom` and `GET /health`. Each is a `handlerPipe` of `apiKeyAuthorization` (header `API_KEY_HEADER_NAME`, value `apikey=<token>`), `ensureAuthenticated` when a session is needed, `guardian` with the module's DTO, and the handler; `GET /session`, `GET /session/refresh` and `POST /session` end with the `resolveAccountRoleNames` postprocessor, which turns role ids into names. These paths, headers and bodies are the contract `apps/client.app` calls.
- `src/app/app.ts` applies `cors` with `origin: '*'`, a rate limit of 2500 requests per minute and `helmet`, all as literals.
- **Configuration** (RG05, RG06): `src/config/index.ts` reads every variable (`API_*`, `AUTH_SECRET`, `MONGODB_*`, `GCP_*`, `FIREBASE_*`, `AWS_S3_*`, `OPENAI_API_KEY`) with fallbacks such as `default_access_token`, `default_auth_secret` and `mongodb://localhost:27017`, and picks the storage driver (S3 or GridFS) and the AI provider (`ChatGPT` or `FakeAI`) from `NODE_ENV`. Never add a fallback; a new value enters the config module and reaches the code by parameter. The variable names are in the root `.env.example`; the user fills `.env` and the production values, the agent only checks names.
- `src/index.ts` and `env.ts` resolve the root `.env` and `RELATIVE_TMP_DIR_PATH` relative to `__dirname`, so moving the entry file or the bundle changes both paths.
- The `Dockerfile` still builds the old `apps/api` and runs the tests of removed packages (RG03).
- `test:unit` matches `src/modules/**/__tests__`, a folder this app does not have, so it runs nothing.

## Tests

- `src/__tests__/app.spec.ts` drives the real routes and the socket.io server with `supertest` and `socket.io-client`, on fakes for `Auth`, `Signer`, storage and multimedia (`src/__tests__/fakes/`) built by `makeEnv()`.
- `FakeAI` and the fake storage read `temp/audiotest.m4a`, which is gitignored (`temp/*`): put a short audio file there before running the tests.
