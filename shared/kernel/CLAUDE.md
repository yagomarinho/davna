# @davna/kernel

Generic types and utilities with no domain: `Duration`, `Merge`, `Metadata`, `ValidObject`, `Converter` (`src/types/`), `applyEntry`, `deepClone`, `concatenate`, `curry`, `isObject`, `removeKeyFrom`, `tokenFromBearer`, `verifySignature` (HMAC), `wait`, `generateSilentWavBuffer` (`src/utils/`) and the `ID` entity with `createID` (`src/entities/id.ts`). Source-only: `main` is `index.ts`, which re-exports `src/`; nothing is compiled.

```bash
yarn tsc -p shared/kernel --noEmit   # no package script; the root `yarn typecheck` covers it too
```

- There is no `test` script yet, although `src/__tests__/deep.clone.spec.ts` exists; `jest.config.ts` already re-exports `@davna/jest`, so adding `"test": "jest"` is all it takes.
- The kernel is the lowest layer and should import nothing from `@davna/*`. Today it does: `src/entities/id.ts` imports `@davna/core` and augments its `EntityURItoKind`, while `@davna/core` imports this package, and `package.json` declares a dependency on itself (`docs/recommendations.md` RG04). Do not add another `@davna/*` import here; a new entity belongs in `@davna/core` or in the module that owns it.
- `@davna/core` also has a folder named `kernel/` (`Either`, `Reader`, `uid`, `timestamp`); it is not this package. Import from the package name, never from a path.
- Nothing here does I/O; keep it that way (`wait` only sets a timer). Some comments in `src/utils/` are still in Portuguese; comments are written in English, so translate one when you touch its file.
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.
