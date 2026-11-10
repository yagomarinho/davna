# @davna/eslint

The shared ESLint 9 flat config (`eslint.config.mjs`, the package's `main`), re-exported by the root `eslint.config.mjs`, which only adds ignores for `.js` and `.mjs` files.

```bash
yarn eslint <path>   # no lint script at the root or in the packages (only apps/client.app has one); run the binary on what changed
```

- It combines `typescript-eslint` recommended, `eslint-plugin-react` and `eslint-plugin-react-hooks` recommended, `js/recommended`, and the `prettier`, `import` and `jest` plugins, with browser, Node and Jest globals for every file.
- Local rules that encode the repository's conventions: `prettier/prettier` is `error` (the style is in the root `.prettierrc.json`: no semicolons, single quotes, trailing commas, `arrowParens: avoid`, 80 columns); unused variables are an error unless prefixed with `_`; components are arrow functions (`react/function-component-definition`); `arrow-body-style: as-needed`; duplicate imports are errors; `no-console` is `warn`, and the few intended console lines carry an `eslint-disable-next-line` comment.
- `import/no-relative-parent-imports` is `error` and `no-restricted-imports` forbids the bare `../../` and `../../../` paths, yet much of today's code imports from parent folders (`../entities`, `../../services`). Expect lint errors in files you touch; do not loosen the rule to silence them, and fix the imports you add.
- `@typescript-eslint/no-explicit-any` and `no-empty-object-type` are off; that is not a license for new `any`.
- A change here changes every package's lint. Check it by running ESLint over the whole repository before and after, and state the difference in the change.
- `node_modules` is not installed in a fresh clone; install with Yarn 1 (`corepack enable`, or `npm i -g yarn@1`, then `yarn`) before running ESLint.
