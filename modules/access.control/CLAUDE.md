# @davna/access.control

The roles context: the `Role` entity (`name`, `description`; `src/entities/role.ts`), its MongoDB repository `RoleRepository` (`src/repositories/role.repository.ts`), the `getRole` service and the `mergeRoles` middleware. Source-only: `main` is `index.ts`, and `src/index.ts` exports `entities`, `repositories` and `services`.

```bash
yarn workspace @davna/access.control test
yarn workspace @davna/access.control test:handlers   # no handlers yet: matches nothing
yarn workspace @davna/access.control test:services
yarn tsc -p modules/access.control --noEmit          # no package script
yarn test:modules                                    # from the root: every module's tests, with a summary
```

- An account holds role **ids** (`account.roles`); `mergeRoles` (`src/middlewares/merge.roles.ts`) replaces them with the `Role` entities read through `QueryBuilder().filterBy('id', 'in', ...)`. It is **not exported** by `src/index.ts`, so no app can use it yet; exporting it is a change of the module's public surface.
- `apps/monolith.api`'s `resolveAccountRoleNames` postprocessor turns the roles into their names for the session responses; that file uses an older repository API and is part of `docs/recommendations.md` RG01.
- `RoleRepository` reads `MONGODB_ROLE_CONNECT_URI`, `MONGODB_ROLE_DATABASE` and `MONGODB_ROLE_COLLECTION` with fallbacks (`mongodb://localhost:27017`, `db`, `roles`) (RG05). The collection name is a contract with the data already in production; changing it is a production procedure (`docs/process/production-procedures.md`).
- `package.json` declares `@davna/infra` and `@davna/kernel`; the code imports `@davna/core` and `@davna/infra` (RG15).

## Rules

- The module never imports another module: it depends only on `@davna/core`, `@davna/infra` and `@davna/kernel`, and the app composes it with the others.
- Business rules live in services (`Service`, returning an `Either`), tested with fakes; handlers and middlewares only translate a request into a call and a result into a `Response` (`docs/patterns/business-rules.md`).
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.

## Tests

- `src/services/__tests__/get.role.spec.ts` uses a mocked entity context and an in-memory repository; no database runs.
