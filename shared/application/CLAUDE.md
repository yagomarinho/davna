# @davna/application

The HTTP adapter: it runs `@davna/core` handlers on Express 5. Source-only: `main` is `index.ts`, and `src/index.ts` exports only the v1 surface: `Application({ routes, port })` (`mount`, `start`, `stop`, `exposeApp`), `Route({ method, path, handler, env })` and the helpers `handlerPipe(...middlewares, handler)` and `PostprocessorsPipe(handler, ...postprocessors)`.

```bash
yarn tsc -p shared/application --noEmit   # no package script; the root `yarn typecheck` covers it too
```

- **No tests and no `test` script** (`docs/recommendations.md` RG13): write characterization tests for what you change before changing it. `jest.config.ts` already re-exports `@davna/jest`.
- `src/v1/app/express.handler.adapter.ts` is the edge between Express and a `Handler`: the request becomes a `Request` (`request.adapter.ts`), the handler runs with the route's `env`, and the `Response` becomes the reply. The status comes from `response.metadata.headers.status` (200 when absent); a `Content-Type` that starts with `audio/` sends `data` as a raw buffer; anything else is JSON. A thrown error or a rejected promise is logged with `console.error` and answers a fixed 500, the only `try/catch` of the adapter.
- `Application` only adds `express.json()`. CORS, `helmet`, rate limiting and `multer` uploads are each app's job, applied on `exposeApp()` before `mount()`.
- `Route` defaults to `get`. The route's `env` is the handler's whole environment: the app composes it there, so a handler never reaches for globals.
- `src/v2/` (`ExecutionContext`, `Guardian`, `ErrorHandler`, `Result`, `http/` and the middleware and postprocessor sequence validators) is under construction and **not exported**; nothing may import it by path until a change decides to publish it.
- The code imports `@davna/core`, but `package.json` declares `@davna/kernel` instead (it works by hoisting, RG15).
- `Route` lives here, not in `@davna/core`; importing it from the core does not compile.
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.
