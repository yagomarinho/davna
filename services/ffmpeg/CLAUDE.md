# @davna/ffmpeg.sdk

The HTTP client of `apps/multimedia.processing`. Source-only: `main` is `index.ts`, and `src/index.ts` exports only `ffmpeg({ config? })`, which returns `getMetadata`, `convertAudioToAAC` and `healthy`. The `Config` type (`src/config.ts`) and the request and response types are not exported yet, so a caller that builds a `config` types it structurally.

```bash
yarn tsc -p services/ffmpeg --noEmit   # no package script; the root `yarn typecheck` covers it too
```

- **No tests and no scripts.** `jest.config.ts` already re-exports `@davna/jest`; a change here starts by adding `"test": "jest"` and the spec of the behavior it touches, with `fetch` faked.
- **It is a contract with `apps/multimedia.processing`:** `POST {baseUrl}/metadata` and `POST {baseUrl}/convert` with the audio as the multipart field `file`, and `GET {baseUrl}/health`; the API key goes in the header named `apiKey.headerName` as `apikey=<key>`, the format `apiKeyAuthorization` of `@davna/infra` expects. A change to a route, a field or the response shape changes both packages in the same change.
- **Configuration:** when no `config` is passed, `DEFAULT_CONFIG()` reads `FFMPEG_SERVICE_BASE_URL`, `API_KEY_HEADER_NAME` and `API_ACCESS_TOKEN` from `process.env` and turns a missing one into the string `"undefined"` (`docs/recommendations.md` RG05). New callers pass `config` from their app's configuration; the default is not extended.
- The functions use the global `fetch`, `FormData`, `Blob` and `File` of Node 22; nothing else is a dependency.
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.
