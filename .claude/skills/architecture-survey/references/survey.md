# Surveying production

How to rebuild each fact in `docs/system/` from its source. The code on `main`, at the commit the picture describes, is the source for what production is, or will be once that commit goes up; the live production (the server running `docker-compose.prod.yml`, its MongoDB, the Vercel project of `apps/client.app`, the providers' consoles) is the source for what production is now. Use both: the code to write the docs, production to catch what the code doesn't show (things made by hand, drift, a container running an old image).

You only read. What only the user can reach (the server, the registry, the Vercel panel, the provider consoles) the user runs or opens, and shares the output; you prepare the command with its expected output (`docs/process/production-procedures.md`, sections 1 and 2). Never read a secret's value and never open a `.env` file: `.env.example` and `apps/client.app/.env.example` list the names.

Run commands from the repo root. On Windows, prefix Git Bash commands that pass arguments starting with `/` with `MSYS_NO_PATHCONV=1`, or use PowerShell.

## The packages and their dependencies (`architecture.md`)

- **The workspaces:** the `workspaces` of the root `package.json` (`apps/*`, `config/*`, `modules/*`, `services/*`, `shared/*`), and each package's name, scripts and declared dependencies:

  ```bash
  for p in */*/package.json; do node -e "const p=require('./$p');console.log('$p', p.name, Object.keys(p.dependencies||{}).filter(d=>d.startsWith('@davna/')).join(','))"; done
  ```

- **The real imports,** which can differ from the declared ones (`docs/recommendations.md`, RG15):

  ```bash
  git grep -h -o -E "from '@davna/[a-z.-]+" -- '<package>/src' | sort | uniq -c
  ```

- **The rules:** `shared/kernel` and `shared/core` know no module, modules never import each other, apps compose them (`docs/process/feature-stages.md`, section 2; `docs/process/pull-requests.md`, section 3.4). A module that imports another module, a deep import (`@davna/<pkg>/src/...`) or a cycle (`docs/recommendations.md`, RG04) is a finding.
- **What compiles:** `yarn typecheck:only-files` lists the files with errors; a package that doesn't compile is said so in the picture, with its register item.
- **The extension points:** what each package exports from its `index.ts` (handlers, ports, providers, DTOs) and is meant for projects that build on davna; davna depends on none of them.

## The data (`data-model.md`, `access-control.md`)

There are no versioned migration scripts yet (`docs/recommendations.md`, RG11), so the data model comes from three sources: the code, the local database the code produces, and production's metadata.

- **From the code:** each module's `src/entities/` (the entities, their tags and versions, and the graph's vertices and edges in `modules/classroom.management/src/entities/graph/`), `src/repositories/` (which collection each repository uses, through `MongoRepository`, `FederatedRepository` or `GoogleSheetsRepository` of `@davna/infra`) and `src/dtos/` (the yup validation). The collection and database names come from configuration: `apps/monolith.api/src/config/index.ts`, and the `MONGODB_*_DATABASE`, `MONGODB_*_COLLECTION` and `MONGODB_STORAGE_*` names of `.env.example`.
- **The indexes and validators the code creates:**

  ```bash
  git grep -n -E "createIndex|createCollection|\\\$jsonSchema|validationAction" -- '*.ts'
  ```

  None today: say so in the picture until a change brings them.

- **The local database:** start the local stack (`yarn api:up`; one stack per machine, `docs/process/parallel-features.md`, section 7) and read the catalog with `mongosh` inside the `mongo` container. Use the database names from configuration:

  ```bash
  docker exec mongo mongosh --quiet --eval "db.adminCommand({ listDatabases: 1, nameOnly: true }).databases.map(d => d.name)"
  docker exec mongo mongosh --quiet <database> --eval "db.getCollectionInfos().map(c => ({ name: c.name, type: c.type, validator: c.options.validator, action: c.options.validationAction, level: c.options.validationLevel }))"
  docker exec mongo mongosh --quiet <database> --eval "db.getCollectionNames().map(n => ({ n, idx: db.getCollection(n).getIndexes().map(i => ({ key: i.key, unique: !!i.unique, ttl: i.expireAfterSeconds })) }))"
  ```

  The GridFS bucket shows as `<bucket>.files` and `<bucket>.chunks`.

- **Production:** the user runs the same three reads on the server, against the production compose's `mongo` container (or the MongoDB host's console, when the database is hosted), and shares the output. Only metadata: names, indexes, validators and `estimatedDocumentCount()`. Never documents, which hold personal data.
- **The spreadsheets:** the lead and suggestion sheets of `modules/costumers.insights`, by the names of their configuration variables (`GCP_LEAD_*`, `GCP_SUGGESTION_*`); the user confirms in Google Sheets that the ranges exist and the columns match `src/entities/`.
- **The files:** the storage driver each app uses (`STORAGE_TYPE`: AWS S3 or MongoDB GridFS) from the app's `env.ts` and configuration; the bucket's name and its lifecycle rules, which the user reads in the AWS console.
- **Access:** the roles of `modules/access.control` (the `Role` entity and its repository), the API-key check (`apiKeyAuthorization` of `@davna/infra`), the sessions and JWT of `modules/identity.access` (`ensureAuthenticated`, `verifyWebsocketAuth`), and the `AuthContext` actors of `shared/core` (`account`, `agent`). In production, the user lists the role ids (`db.<roles collection>.distinct('_id')`, or the field the entity uses), never the accounts.

The local database only proves what the code produces. Whether production matches is the user's read on the server.

## The APIs (`apis.md`)

- **HTTP routes:** `apps/monolith.api/src/app/routes.ts` and `apps/multimedia.processing/src/app/routes.ts` (each `Route({ method, path, handler })` and the middlewares its `handlerPipe` chains). `apps/interaction.conductor` has none in production until it ships (`docs/recommendations.md`, RG02).
- **WebSocket events:** `apps/monolith.api/src/app/create.ws.server.ts` (`socket.on(...)` received, `socket.emit(...)` sent, and the authentication of the connection).
- **The client's proxy routes:** `apps/client.app/src/app/api/` (the Next.js route handlers that call the API with the server-side key).
- **Validation and errors per route:** the module's `src/dtos/` and the handler's `Response` ([errors by layer](../../../../docs/patterns/errors.md)).
- **Limits, CORS, headers:** the Express setup of `shared/application` and the app's `app.ts` (`helmet`, `cors`, `express-rate-limit`), with the values from configuration.
- **From production:** the user calls `GET /health` of the API and of the media service; expect `200`.

## The infrastructure (`infrastructure.md`, `architecture.md`)

From the code:

- the `Dockerfile` and `build.js` of each backend app (`apps/monolith.api`, `apps/multimedia.processing`, `apps/interaction.conductor`): the base image, what is copied, the tests the build stage runs, the entrypoint;
- `docker-compose.prod.yml` (the production containers, images and tags, ports, volumes, health checks, the `wait-for` entrypoint) and `docker-compose.yml` (the local stack);
- `scripts/wait-for*.sh`;
- `.github/workflows/` with its triggers and path filters ([path-filtered pipelines](../../../../docs/patterns/ci-triggers.md)): today only `pr-body.yml` and `checks.yml`, the conformance checks, which build and deploy nothing; `__github__example/` is a historical, commented example; and the ruleset on `main` (`gh api repos/{owner}/{repo}/rulesets`), when the user shares it;
- `apps/client.app/next.config.ts` and a `vercel.json`, when there is one;
- the variable names of `.env.example` and `apps/client.app/.env.example`, and the configuration modules that read them.

```bash
docker compose -f docker-compose.prod.yml config --services
docker compose -f docker-compose.prod.yml config --images
```

From production, run by the user on the server (read-only):

```bash
docker compose -f docker-compose.prod.yml ps --format '{{.Name}} {{.Image}} {{.Status}}'
docker image ls --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedAt}}'
docker inspect --format '{{.Name}} {{.Image}} {{.Config.Image}} {{.State.Health.Status}}' $(docker compose -f docker-compose.prod.yml ps -q)
docker system df
df -h
```

And, also by the user, in the panels: the Vercel project of `apps/client.app` (connected repository, root directory, ignored build step, the variables by name per environment, the last deploy and its commit); the image registry (the repositories and tags the compose pulls); the MongoDB host, AWS S3, Firebase, Google Cloud and OpenAI (the projects, buckets and keys by name, and their limits); the DNS.

What production shows and the code doesn't is a finding: a container running an image that no commit built, a variable on the server that `.env.example` doesn't name, a Vercel setting that differs from the repository, a retention that differs from the privacy policy (`apps/client.app/src/modules/feedback/pages/privacy.politics.tsx`). Record it in the "Drift" section of `infrastructure.md`, and tell the user.

## The use cases (`use-cases.md`)

Each feature's `3.use.cases.md` (`grep -n "^#* *UC-"`), crossed with what stage 9 says is done. A use case only enters the list when its code is in the commit the picture describes. One that changes an earlier one ("Changes Feature 001, UC-04") says so in the notes below the table. Before the first feature, the use cases come from the code (the handlers of each module) and from the design drawing `docs/project/use.cases.drawio`, marked as such, with where the code differs from the drawing.

## The glossary (`language.md`)

- **The terms:** the term table of stage 1 of each feature shipped since the last picture, and of the definition (`1.refactoring.definition.md`) of each refactoring shipped since then, crossed with what is done and with what `/pull-request` already brought. A term only enters when its code ships, under the context of the module that owns it ([ubiquitous language](../../../../docs/patterns/ubiquitous-language.md), "The glossary").
- **The names in the code:** check that the "In the code" column matches the code about to ship: the entity tags and fields, the collection names in configuration, the routes, the socket events and the DTO fields.
- **The forbidden words and the legacy names,** in the code and the docs, outside the folders of the features, refactorings and improvements, whose history keeps the old words:

  ```bash
  git grep -n -i -w -E '<word>|<other word>' -- ':!docs/features' ':!docs/refactorings' ':!docs/improvements'
  ```

  A word forbidden on screen can be right in the code, or as a technical term of another context: read each hit in context before calling it a finding. The open conflicts of the pattern ("Open questions") are findings until the user resolves them.
