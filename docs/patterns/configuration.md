# Configuration outside the code

**Status:** Proposed on 2026-11-10, brought from the author's pattern catalog. Today davna reads `process.env` all over the code, with no validation and with insecure defaults; see "Known deviations".

Values that can change outside the code are not written in the middle of it. Domains, URLs, database URIs and collection names, ids, bucket names, regions, limits and keys live in one configuration module per package. Those that change by environment come from environment variables, validated in one place, and the rest of the code only receives the values by parameter.

## Problem

- A URL or an id spread through the code breaks when the value changes and forces a hunt for every occurrence.
- Without a single place, the same information diverges between files and between apps: today the same MongoDB URI and collection names are read in the app's config, in the entities' repository factories and in the storage helper.
- A production value as a silent default makes a script run without configuration act on production by accident.
- A development value as a silent default makes production run with it without warning: with `AUTH_SECRET` missing, the API signs tokens with a known string; with `API_ACCESS_TOKEN` missing, it accepts a known key.
- Without validation at the entry, a wrong value only shows up as a network, authentication or provider error, far from the cause.

## Decision

- **Only one place knows the names of the environment variables.** A schema validates everything at once, at load time, and stops with the list of every variable that is missing or invalid.
- **The schema library:** zod is the recommended one (it is the author's standard). yup, which davna already uses for the DTOs, stays acceptable until a migration to zod is decided and done; a package that gets its configuration module before that migration may write the schema in yup, with `abortEarly: false`, so every problem comes out at once.
- **The code receives the configuration by parameter or by props.** A function receives only the values it needs, never the whole object nor `process.env`. Whoever reads the configuration is the edge: the app's composition (`src/app/env.ts`, `src/index.ts`), a Next.js route handler or server component.
- **No production value is a silent default,** and no secret has a default at all. A variable production needs is mandatory in the schema; a default only applies when it is safe in every environment.
- **Only `.env.example` goes to git,** with fictitious values and the explanation of each variable. The real files stay on the machine (`.env*` is in the root `.gitignore`), and production's on the server or in the Vercel panel.

### In backend packages (apps, modules, services, scripts)

Each package with configuration has a `config/` folder with two files:

- **`config/env.ts`:** the schema and the names of the variables. It reads `.env` (and `.env.<environment>` when the package needs more than one) from the package's root or the repository's, as the package documents.
- **`config/index.ts`:** the configuration object grouped by subject (databases, auth, providers, storage), which joins the environment's values with the project's fixed names: route paths, header names, collection names that are a contract.

```
.env.example (git) ──► .env, .env.<environment> (machine only) + environment variables
                                   │
                         config/env.ts (schema, the variables' names)
                                   │
                         config/index.ts (grouped object + fixed names)
                                   │
                code: receives its part by parameter or props
```

- **A module never reads the environment.** `modules/*` and `shared/*` export factories that receive their configuration (a repository's URI, database and collection; a provider's key); the app composes them with its config.

### In the Next.js app (`apps/client.app`)

- Server-only values (`API_BASE_URL`, `API_ACCESS_TOKEN`) are validated in a server-only module and reach the code through route handlers, server actions or server components; they never reach the browser.
- Browser values (`NEXT_PUBLIC_*`) are inlined in the bundle at build time: never a secret. They are validated in their own module, so a missing one fails the build, not the user's session.

## How it works

- **Validation at boot:** the parse runs when the module is imported. A missing mandatory variable brings the process down (the container, the dev server, the script) at the start, with its name in the message.
- **Reading order,** from what weighs less to what weighs more: environment variables, `.env`, `.env.<environment>`. An empty key in the file keeps the environment's value.
- **The safest default applies when nothing is given.** The storage and AI drivers are chosen by an explicit variable, not by `NODE_ENV`, and an administrative script without a chosen environment uses the local one and shows the environment before acting.
- **Secrets** (keys, passwords, tokens, private keys) never go into `.env.example` and are never read by the agent: the user types them in the server's `.env`, in the panel or in the shell. When only some commands need a secret, the schema leaves it optional, and the command requires it with a message that names the variable. A secret with a default of `''` is a silent default: the gap only shows at the first call.
- **Tests:** the schema is tested with an explicit environment object (and, when it reads files, with files in a temporary folder), never with `process.env` nor the real files. That is why the module exports a `parseEnv(source)` besides the ready object.

## How to use

1. **New value that changes by environment,** or may change outside the code: it goes into the schema, into `.env.example`, into the local `.env` and where production reads it (the server's `.env`, the Vercel panel, a CI secret).
2. **A fixed project name** (a route path, a header name, a cookie name): it goes into `config/index.ts` or a named constant in the module that uses it, with a comment saying with whom it is a contract.
3. **The code receives the configuration by parameter.** A pure function receives only the values it needs.
4. **A package that starts having configuration:** it creates the module in this format, with the schema's tests.
5. **The same value in more than one app** (`API_KEY_HEADER_NAME`, `API_ACCESS_TOKEN`): it stays in each app's module until a shared package exists; when one changes, check the others.

## Limits

- **What stays in the code:** names defined by third parties that do not vary between environments: HTTP methods, protocol headers such as `authorization`, MIME types, API versions.
- **Tool configuration files** are already the place of the value and do not go through this pattern: `docker-compose*.yml`, the Dockerfiles, `next.config.ts`, `tsconfig*.json`, the ESLint and Jest configs and CI workflows.
- **Product constants,** which do not change with the environment, stay as named constants: domain limits, the supported MIME types, the token lifetimes when they are a product decision.

## Discarded alternatives

- **Production or development values as defaults in the code:** running without configuration would use the wrong value without warning.
- **A configuration file per environment, versioned with real values:** it mixes secrets and machine values with git and does not serve values that come from the server, the panel or CI.
- **Reading `process.env` where the value is used:** it spreads the variables' names and postpones validation to the middle of a request.

## Where it is in the code

Not in the code yet. What comes closest today:

| Package or app                | Configuration                                                                              | Environment                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `apps/monolith.api`           | `src/config/index.ts` (`Config()`, one object grouped by subject, not validated)           | `process.env`, root `.env.example`           |
| `apps/multimedia.processing`  | `src/app/env.ts` (`Env()`, reads `process.env` inline)                                      | `process.env`                                |
| `apps/interaction.conductor`  | `src/app/env.ts` (copied from `multimedia.processing`)                                      | `process.env`                                |
| `apps/client.app`             | `src/config/server.ts` and `src/config/client.ts` (not validated)                          | `apps/client.app/.env.example`, Vercel panel |
| `services/ffmpeg`             | `src/config.ts` (`DEFAULT_CONFIG()`, receives an optional `config`)                        | `process.env`                                |

## Known deviations

- **Insecure defaults.** `apps/monolith.api/src/config/index.ts`, `apps/multimedia.processing/src/app/env.ts` and `apps/interaction.conductor/src/app/env.ts` fall back to `'default_access_token'` for `API_ACCESS_TOKEN`, `'default_auth_secret'` for `AUTH_SECRET` and `mongodb://localhost:27017` for every MongoDB URI.
- **Silent empty secrets.** The Firebase Admin and Google Cloud credentials and the spreadsheet ids default to `''`.
- **Drivers chosen by `NODE_ENV`.** The storage (`AWS_S3` or `MONGO_GRIDFS`) and the AI driver (`chatgpt` or `fake.ai`) switch on `NODE_ENV === 'production'`, not on an explicit, validated variable.
- **No validation.** No package validates its environment; `services/ffmpeg/src/config.ts` turns a missing variable into the string `'undefined'` by template literal, and `apps/multimedia.processing` resolves `RELATIVE_TMP_DIR_PATH!` without checking it.
- **Modules and shared packages read the environment.** The repository factories of the graph entities (`modules/classroom.management/src/entities/graph/**`), `modules/classroom.management/src/utils/storage.ts`, the repositories of `access.control`, `costumers.insights` and `identity.access`, and `shared/infra` (`providers/gpt.model/chatgpt.ts`, `providers/auth/firebase.admin.app.ts`) read `process.env` directly.
- **The Jest setup reads the repository's root `.env`** (`config/jest/jest.setup.js`), so tests can depend on the machine's real values.
- **yup, not zod.** The author's standard is zod; davna uses yup. The migration is a recommendation of the repository-level register ([`docs/recommendations.md`](../recommendations.md), RG09), not part of this pattern's adoption; the configuration module and its validation are RG05 and RG06.
