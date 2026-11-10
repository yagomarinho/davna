# @davna/jest

The shared Jest 30 config (`jest.config.ts`, the package's `main`), with ts-jest. Each package's `jest.config.ts` imports it and spreads it, overriding only what differs.

- `preset: 'ts-jest'`, the `node` environment, `clearMocks`, and only `*.spec.ts` and `*.spec.tsx` files run. Specs live next to the code they test, in `src/**/__tests__/*.spec.ts`, with fakes in `__fakes__/` or `fakes/` folders beside them; that is this repository's convention and new tests follow it.
- Coverage is always collected (v8, `text-summary` and `lcov`) into a `coverage/` folder of the package, which is gitignored.
- `jest.setup.js` loads the **root `.env`** (`../../.env`, relative to this folder) through `dotenv` before every test file, so the integration specs that read `process.env` (`shared/infra`, `apps/monolith.api`) see the developer's local values. This ties the config to the repository layout, and `dotenv` comes from the root `package.json`, not from this package. A unit test must never depend on a value from `.env`: it passes its configuration explicitly or sets the variable in the test.
- Jest only transpiles: type errors are caught by `yarn typecheck` (or `yarn tsc -p <folder> --noEmit`), not by `yarn workspace <name> test`.
- `jest`, `ts-jest`, `@types/jest` and `jest-environment-node` are dependencies of this package and reach the others by hoisting.

## A package that adopts tests

- a `jest.config.ts` that spreads `@davna/jest` (most packages already have one);
- a `"test": "jest"` script in its `package.json` (today only the root declares `@davna/jest`, as a devDependency; a package that uses it should declare it too, `docs/recommendations.md` RG15);
- specs under `src/**/__tests__/`, so that the package's `tsconfig.json` (`include: ["src"]`) type-checks them and the app's `tsconfig.build.json` excludes them (`**/*.spec.ts`).
