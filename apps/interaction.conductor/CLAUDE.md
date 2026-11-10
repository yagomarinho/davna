# @davna/interaction.conductor

The future orchestrator of the agent's reply in a classroom: transcribe the student's audio, translate it, generate the teacher's answer, synthesize its speech, read the audio's metadata, store it, append the agent's message and account for usage. **Today it is a skeleton that does not compile** (`docs/recommendations.md` RG02); nothing deploys it and no other package calls it.

```bash
yarn workspace @davna/interaction.conductor dev         # ts-node-dev on src/index.ts, which is empty
yarn workspace @davna/interaction.conductor typecheck   # tsc over tsconfig.build.json: fails today
yarn workspace @davna/interaction.conductor build       # rimraf dist, typecheck, then build.js: fails today
yarn workspace @davna/interaction.conductor test        # one placeholder spec
```

- **What is there:** `src/index.ts` holds only a comment. `src/app/{app,env,routes}.ts` were copied from `apps/multimedia.processing` (port 3334, `/metadata`, `/convert`, `/health`) and import providers, services and handlers that do not exist in this app; `routes.ts` imports `Route` from `@davna/core`, which does not export it (it is in `@davna/application`). `src/handlers/classroom.interaction.guidance.ts` is an unfinished `Handler`, and `src/services/teacher.generates.response.ts` and `transcribe.and.append.ts` are an older reply flow that uses names it never imports. `src/__tests__/app.spec.ts` asserts `3 === 3`. The `Dockerfile` was copied from the media service and builds old names (RG03).
- **Do not patch the skeleton piecemeal.** The app becomes real through the feature RG02 proposes, which first fixes its contract on davna's own terms: the trigger (unprocessed messages in a classroom), the `@davna/classroom.management` handlers it calls (`fetchUnprocessedMessages`, `appendMessage`, `storeDerivedContents`, `checkMaxEstimatedConsumption`), the `agent` actor of `AuthContext` and the `idempotency_key`. Any implementation that speaks that contract can replace this app.
- **Extension points to keep pluggable:** the model provider is the `GPTModel` port of `@davna/infra` (`ChatGPT`, `FakeAI` or another), and the persona and translation prompts, today literal strings in `src/utils/ai.generate.response.ts`, come from configuration or a provider, never from code.
- **Configuration** (RG05): `src/app/env.ts` reads `RELATIVE_TMP_DIR_PATH`, `API_KEY_HEADER_NAME` and `API_ACCESS_TOKEN` with fallbacks (`x-api-key`, `default_access_token`); none of that shape is kept.
- `package.json` declares `@davna/application`, `@davna/infra` and `@davna/system.monitoring`, but the code also imports `@davna/core` (RG15), and the RG02 contract will need `@davna/classroom.management` declared too.
- Until RG02 lands, the root `yarn typecheck` stays red because of this app; that is expected, not a regression to chase.
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.
