# The production picture

This folder describes **only what is in production**, up to a commit of `main`. What is specified or being built lives in the features (`docs/features/`), refactorings (`docs/refactorings/`) and improvements (`docs/improvements/`).

It is created and rewritten on demand by the project skill `architecture-survey` (`/architecture-survey`), which only the user runs: after a deploy, or when `/pull-request` reports that 5 or more pull requests were merged into `main` since the commit the picture names. Nothing here exists yet; the first survey creates it. `/architecture-survey` carries no authorization: its result is committed only with the user's explicit yes, on a `docs/` branch, and reaches `main` by its own pull request.

## What it will hold

| File                | What it describes                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `overview.md`       | what is in production, by delivery, and the header with the picture's date and commit                |
| `architecture.md`   | the packages, the apps, their dependencies and the rules between them, with a diagram                |
| `data-model.md`     | the MongoDB collections, the graph's vertices and edges, the storage and the spreadsheets, with a diagram |
| `use-cases.md`      | the use cases in production                                                                           |
| `apis.md`           | the HTTP routes, the socket events and the media service's routes                                    |
| `access-control.md` | authentication, sessions, roles and what each actor may do                                           |
| `infrastructure.md` | the Docker images, the production compose, the client's Vercel project and the providers             |
| `language.md`       | the glossary ([ubiquitous language](../patterns/ubiquitous-language.md)), which `/pull-request` also updates with each change's terms |

## Rules

- **Each document's header** says "Production picture on YYYY-MM-DD, up to commit `<sha>`", and a table "Where it comes from" names its sources.
- **Only through pull requests into `main`** ([Pull requests](../process/pull-requests.md)): the picture by `/architecture-survey`, from the main folder, in its own docs pull request ([Parallel features](../process/parallel-features.md)); the glossary also by `/pull-request`, with the change's terms, in the change's pull request.
- **The design references** in `docs/project/` (`system.architecture.drawio`, `database.models.drawio`, `use.cases.drawio`) are the original design drawings; they are kept as they are and cited by the picture, which says where production differs from them.
