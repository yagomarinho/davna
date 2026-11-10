# Project patterns

Solutions that repeat across the repository, recorded so that each new case follows the same path instead of reinventing it. Each pattern explains the problem, the decision, how it works, how to use it, its limits, the discarded alternatives, where it is in the code and the known deviations of today's code.

The patterns below were proposed on 2026-11-10, brought from the author's pattern catalog and adapted to davna's stack (Yarn 1 workspaces, TypeScript, yup, MongoDB, Express, Docker compose, Next.js on Vercel). None is implemented yet: each one says how far today's code is from it.

## Patterns

| Pattern                                                    | Solves                                                                                                                                                                   | Status                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| [Business rules in the domain](business-rules.md)          | A business rule is decided by pure, tested functions; MongoDB, the providers and the HTTP layer only deliver facts, execute and give support                            | Proposed (2026-11-10)   |
| [Configuration outside the code](configuration.md)         | Domains, URLs, ids, keys and limits live in one validated configuration module per package, read from environment variables; the code receives them by parameter       | Proposed (2026-11-10)   |
| [Path-filtered pipelines](ci-triggers.md)                  | Each pipeline (GitHub Actions, Vercel) runs only when what it uses changes; a docs-only pull request builds and deploys nothing; required checks always run                                                 | Proposed (2026-11-10)   |
| [Ubiquitous language](ubiquitous-language.md)              | Each concept has one name, the same in docs, code, data, contracts and screen, in a single glossary; terms come from the user, and the name follows the concept         | Proposed (2026-11-10)   |
| [Readable functional style](functional-style.md)           | A use case reads as a list of named steps: each step goes on with its value or stops with a reason on the `Left` side, the chain ends in a fold, and decisions are pure | Proposed (2026-11-10)   |
| [Errors by layer](errors.md)                               | Every error is plain data with a layer, a name, a stable code, safe details and a chained cause; no classes, no ad hoc `{ status, message }` objects                     | Proposed (2026-11-10)   |
| [Two-layer validation](two-layer-validation.md)            | A value written by one process and used by another is validated on write and again on read, by the same rules, kept in one place both sides test                       | Proposed (2026-11-10)   |
| [Image before go-live](image-before-go-live.md)            | A change to a backend app only goes live once its Docker image is built from the commit, started and healthy, with an immutable tag written in the go-live's "Prepare" | Proposed (2026-11-10)   |

Possible statuses:

- **Proposed:** under discussion; it guides new cases but does not bind them until the user accepts it;
- **Implemented:** it exists in the code and applies to new cases.

A pattern moves from Proposed to Implemented with the user's acceptance and the change (feature or refactoring) that brings the code in line; the date and the change go into its status line.

## How to record a pattern

1. Create `docs/patterns/<name>.md` with the sections: problem, decision, how it works, how to use, limits, discarded alternatives, where it is in the code and known deviations.
2. Add a row to the table above.
3. Cite the document in a comment of the code that implements the pattern and, if it changes how work is done in the repository, in the `CLAUDE.md` too.
