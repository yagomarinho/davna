# Executing a refactoring

## Before the first change

1. **The safety net is approved** (`3.tests.checklist.md`, with the approval written in it), and the branch `refactor/<name>` exists in its worktree outside the project tree (`node scripts/worktree.js new <name> --type refactor`; SKILL.md, section 8). Run `yarn install` in the worktree (Yarn 1 classic; if `yarn` is not on PATH, `corepack enable` or `npm i -g yarn@1`).
2. **Write the missing characterization tests first,** and see them green against today's code. A test that fails against today's code isn't characterization: it found a defect. Report it; it becomes a fix, outside the refactoring.
3. **Record the baseline** at the top of `4.implementation.checklist.md`, with the counts:
   - `yarn typecheck`; while `docs/recommendations.md` RG01 to RG03 keep it red, the list of files with errors from `yarn typecheck:only-files`, which no step may grow;
   - `yarn test:modules`, and `yarn workspace @davna/<package> test` for every package the plan touches (`shared/infra` and the apps have their own `test` scripts);
   - the lint: `yarn workspace @davna/client-app lint` for the client; ESLint with the root `eslint.config.mjs` for the rest (no root `lint` script exists yet).

## Each step

- **One step of the plan at a time,** in order.
- **After each step:** the package's tests, then the suites of the baseline, and `yarn typecheck` when names or types moved. ts-jest may only transpile (the packages set `isolatedModules`), so a renamed type is only checked by `tsc`.
- **A red test:** undo or fix the step before the next one. Don't stack steps on a red suite.
- **A test that needs an assertion change** means the behavior changed: stop, tell the user, and decide together.
- **Tick the step** in `4.implementation.checklist.md` with the date.

## Renames

- **Code:** rename with the type checker's help, which finds the references; then search for what it doesn't see, such as strings, entity tags (`_t`), `EntityURItoKind` entries, environment variable names, docs and comments: `git grep -n -w '<old>'`.
- **Files and packages:** a moved or renamed `src/**/*.ts` keeps its MIT license header; a new one gets it (`yarn add:header`). A package rename changes the `workspaces`, the importing `package.json` files, the root `tsconfig.json` references and the Dockerfiles, then `yarn install` regenerates `yarn.lock`, which is never edited by hand.
- **MongoDB:** applied data changes are never edited; each one is a new step, written as a production procedure until versioned migration scripts exist (`docs/recommendations.md`, RG11):
  - a field: `db.<collection>.updateMany({ <old>: { $exists: true } }, { $rename: { '<old>': '<new>' } })`, after counting the documents it will change (`countDocuments` with the same filter) and a `mongodump` of the collection; in an expand-and-contract, the code reads both names (or upgrades on read through a new entity version `_v`) until the backfill and the "After" group drop the old one;
  - a collection: `db.<old>.renameCollection('<new>')` together with the change of its `MONGODB_<NAME>_COLLECTION` variable, by name, in every `.env` the user keeps;
  - an index: a new index with the new name built before the old one is dropped (`db.<collection>.createIndex(...)`, then `dropIndex('<old>')`);
  - a validator: `db.runCommand({ collMod: '<collection>', validator: { $jsonSchema: ... } })` with the new names, `validationAction: 'warn'` first.
  Rehearse each one against the local Mongo of `docker-compose.yml` (`yarn api:up`), then check the result with the queries below.
- **Contracts:** a DTO field, a route, a socket event or a handler that changes its name changes its consumers in the same deploy (`apps/client.app`, the apps that compose the module), or keeps both names for one version, as the plan says. An extension point that projects building on davna consume keeps the old name, deprecated, for at least one version unless the user decided otherwise in the definition.
- **Files in storage** (GridFS, S3): a renamed key is a new object; the old one stays until the "After" group says otherwise.
- **The glossary:** each rename done removes its row from the legacy names table at the `/pull-request` of its code; each one deferred keeps its row, with the register item.

## Read-only queries for the inventory and the checks

Against the local Mongo only, in `mongosh` (`docker exec -it mongo mongosh` while the local stack is up). Production is queried by the user, with the same read-only commands.

```js
db.getCollectionNames()
db.getCollectionInfos({ name: '<collection>' })            // the validator, if any
db.<collection>.getIndexes()
db.<collection>.distinct('_t')                             // the entity tags stored
db.<collection>.countDocuments({ '<field>': { $exists: true } })
db.<collection>.aggregate([{ $group: { _id: '$_v', n: { $sum: 1 } } }])  // documents per entity version
```

## Before every commit

1. The suites of the baseline green (or the typecheck error list not grown), and the builds of the apps touched (`yarn workspace @davna/<app> build`) when types or builds are touched.
2. Data steps: rehearsed against the local Mongo, with the query that shows the result.
3. Docker: when a `Dockerfile` or compose file changes, the image builds and the local stack answers `/health` (`yarn api:up`, then `yarn api:down`).
4. The interface: when a screen of `apps/client.app` is touched, check it in the browser, at 375 px too.
5. Ask for the commit stating "Repo: davna", with a summary of what goes in, naming the folder and the branch. The message is a Conventional Commit in English (`refactor: <summary>`, or `test: <summary>` for a characterization test that lands on its own), with the attribution lines the session provides.

## Before the merge

- The checks of section 2 of `4.implementation.checklist.md` ticked: the full suites, the builds, the data, the images, and the sweep of the old names, which should remain only in the refactoring's folder and in the glossary's legacy names table.
- The branch synced with `main` by merge, never rebase (`chore: sync refactor/<name> with main`), with the tests green after the sync (`docs/process/parallel-features.md`, section 5).
- The pending items listed for the user: unchecked boxes, open decisions, register items whose trigger arrived (in the refactoring's register and in `docs/recommendations.md`), agent decisions without review (`docs/process/gates.md`, section 2).
