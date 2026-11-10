# @davna/system.monitoring

The health check every backend app mounts as `GET /health`. Source-only: `main` is `index.ts`, and `src/index.ts` exports only the handlers (`healthCheckHandler`); the `healthCheck` service (`src/services/health.check.ts`) is internal.

```bash
yarn workspace @davna/system.monitoring test
yarn workspace @davna/system.monitoring test:handlers
yarn workspace @davna/system.monitoring test:services
yarn tsc -p modules/system.monitoring --noEmit   # no package script
yarn test:modules                                # from the root: every module's tests, with a summary
```

- **The response is a contract:** `200` with `{ healthy: true }`. The `docker-compose.yml` healthchecks (`wget -qO- http://localhost:<port>/health`), the startup wait of the API (`scripts/wait-for*.sh`, which waits for the media service's `/health`), `healthy()` of `@davna/ffmpeg.sdk` and the go-live checks all depend on it; changing the path, the status or the body changes them in the same change.
- The check is liveness only: it answers without touching MongoDB, the storage or any provider. A readiness check that tests dependencies would be a new handler, decided in its own change, not a change to this one.
- The route needs no API key nor session in the apps that mount it.
- `package.json` declares no dependency; the code imports `@davna/core` (`docs/recommendations.md` RG15).

## Rules

- The module never imports another module; it depends only on `@davna/core`.
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.

## Tests

- `src/handlers/__tests__/health.check.handler.spec.ts` mocks the service; `src/services/__tests__/health.check.spec.ts` runs it.
