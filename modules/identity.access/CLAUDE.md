# @davna/identity.access

Accounts and sessions: the `Account` (`name`, `external_ref`, role ids) and `Session` entities, login with credentials through the `Auth` provider (Firebase Admin, `@davna/infra`), and JWT sessions signed by `Signer` (refresh, revoke, verify). Source-only: `main` is `index.ts`, and `src/index.ts` exports `dtos` (`loginValidation`, `refreshValidation`, `verifyValidation`), `entities`, `handlers` (`loginWithCredentialsHandler`, `refreshSessionHandler`, `revokeSessionHandler`, `verifySessionHandler`), `middlewares` (`ensureAuthenticated`, `verifyWebsocketAuth`) and `repositories` (`AccountRepository`, `SessionRepository`); the services are internal.

```bash
yarn workspace @davna/identity.access test
yarn workspace @davna/identity.access test:dtos
yarn workspace @davna/identity.access test:handlers
yarn workspace @davna/identity.access test:services
yarn tsc -p modules/identity.access --noEmit   # no package script
yarn test:modules                              # from the root: every module's tests, with a summary
```

- **Header contract with the clients:** the session token travels in the header named by `config.auth.jwt.token.headerName` and the refresh token in `config.auth.jwt.refresh_token.headerName` (the API uses `authorization` and `x-refresh-authorization`), both as `Bearer <token>` read by `tokenFromBearer` of `@davna/kernel`. The handlers and middlewares take that `config` (`ConfigDTO`, `src/dtos/config.ts`) from the route env, never from the environment; `src/fakes/make.config.ts` is the tests' copy.
- `ensureAuthenticated` answers 401 when the token is missing, malformed or its session is no longer valid, and otherwise puts `metadata.auth`, the `AuthContext` built by `createAuthContext` (`@davna/core`) from the actor and principal stored in the session, which the classroom handlers read. `verifyWebsocketAuth` does the same for a socket.io handshake.
- The account is found by `external_ref`, the identity provider's user id, and created on its first login (`src/services/login.with.credentials.ts`); its `roles` are role ids, resolved by `@davna/access.control`.
- `Session` has a `SESSION_KIND` (`generated`, `delegated`). Delegated sessions are not implemented: `src/services/create.delegated.session.ts` is a stub that exports a second `getSessionInfo`, colliding with `src/services/get.session.info.ts`. Never import it; rename it in the change that implements delegation.
- **Configuration read inside the module** (RG05 in `docs/recommendations.md`): `AccountRepository` and `SessionRepository` read `MONGODB_ACCOUNT_*` and `MONGODB_SESSION_*` with fallbacks (`mongodb://localhost:27017`, `db`, `accounts`, `session`). New code receives these by parameter. The collection names are a contract with production data.
- No token, refresh token, password or e-mail goes into a log, an error message or a response other than the login and session responses themselves.
- `verifyWebsocketAuth` imports `socket.io`, which only the apps declare; `package.json` also lacks `@davna/core`, which the code imports (RG15).

## Rules

- The module never imports another module; it depends only on `@davna/core`, `@davna/infra` and `@davna/kernel`.
- Business rules live in the services (`Service`, returning an `Either`); handlers and middlewares only translate the request and the result (`docs/patterns/business-rules.md`).
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.

## Tests

- Handler specs mock their services with `jest.mock`; service specs use `InMemoryRepository` of `@davna/infra` and `Auth` and `Signer` built from `jest.fn()`; DTO specs call the validators directly. No spec reaches Firebase or MongoDB.
