# @davna/multimedia.processing

The FFmpeg service (Express 5 through `@davna/application`, port 3334): `POST /metadata` reads an audio file's metadata (name, mime, duration, format, codec) and `POST /convert` converts it to AAC, both with the audio in the multipart field `file`, plus `GET /health`. It uses `ffmpeg-static` and `ffprobe-static` and works on files in a temporary folder. Deployed as a Docker image (`Dockerfile`) next to the API in `docker-compose.prod.yml`; the deploy is manual today (`docs/recommendations.md` RG14).

```bash
yarn workspace @davna/multimedia.processing dev         # ts-node-dev with respawn, src/index.ts
yarn workspace @davna/multimedia.processing typecheck   # tsc over tsconfig.build.json (specs excluded)
yarn workspace @davna/multimedia.processing build       # rimraf dist, typecheck, then build.js (esbuild bundle, dist/index.js)
yarn workspace @davna/multimedia.processing test
yarn workspace @davna/multimedia.processing test:handlers
yarn workspace @davna/multimedia.processing test:services
```

- **It is a contract with `@davna/ffmpeg.sdk`** (`services/ffmpeg`), its only client: routes, the `file` field, the API key header (`API_KEY_HEADER_NAME`, value `apikey=<token>`, checked by `apiKeyAuthorization` of `@davna/infra`) and the response shapes change together in both packages.
- `src/app/routes.ts` imports `Route` from `@davna/core`, which does not export it (it is in `@davna/application`), so the app does not type-check nor build as it is; the same mistake is recorded for `apps/interaction.conductor` in RG02. Fixing the import is the first step of any change here.
- Each route is a `handlerPipe` of `apiKeyAuthorization`, `guardian` with `fileGuard` (`src/utils/file.guard.ts`, yup: a `Buffer`, an original name and a mime type) and the handler; the upload itself is read by `multer` in memory (`src/app/app.ts`). There is no size limit on the file yet.
- The business of the service (what is converted, to which codec, how the metadata is read) lives in `src/services/`; handlers only map the result to a `Response`. `src/providers/audio.metadata.provider.ts` is the port the handlers receive in their env.
- **Configuration** (RG05): `src/app/env.ts` reads `RELATIVE_TMP_DIR_PATH` (resolved from `src/app/`), `API_KEY_HEADER_NAME` and `API_ACCESS_TOKEN` with fallbacks (`x-api-key`, `default_access_token`); `src/utils/ffmpeg.path.ts` and `ffprobe.path.ts` try the static binary, `FFMPEG_PATH`/`FFPROBE_PATH` and the usual system paths. The port 3334 and the rate limit (500 per minute) are literals in `src/app/app.ts`. Never add a fallback; new values enter a configuration module.
- The `Dockerfile` still builds `apps/ffmpeg` and copies a `package.build.json` that does not exist, and `docker-compose.yml` points at that Dockerfile path (RG03).
- The code imports `@davna/core` without declaring it (RG15).
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.

## Tests

- `src/__tests__/app.spec.ts` drives the real app with `supertest`, and the service specs run the real `ffmpeg` and `ffprobe` binaries on files in `temp/`; the handler specs mock `node:fs/promises` and the provider.
- They read `temp/audiotest.m4a`, `temp/audiotest.webm` and `temp/audiotest.ogg`, which are gitignored (`temp/*`): put short audio files with those names there before running them. The app spec takes the folder from `RELATIVE_TMP_DIR_PATH`, read from the root `.env`.
