---
name: architecture-survey
description: Surveys production and rewrites the production picture in docs/system, to visualize, update and understand the architecture. Rebuilds the facts from their sources (the code on main, the collections, indexes and validators the code produces in the local MongoDB, and the live production - the server running docker-compose.prod.yml, its MongoDB metadata, the Vercel project and the providers - read-only, with drift as findings), rewrites the documents of docs/system with their sources, updates the two diagrams (architecture.svg and data-model.svg) and runs the full glossary check (language.md). Use it on demand, when the user asks to see or refresh the architecture, or when /pull-request reminds that the picture is behind the pull requests merged into main since it. It carries no authorization and never pushes; it shows what changed and asks for the commit, on a docs/ branch whose pull request /pull-request prepares. Only the user runs it, with /architecture-survey.
argument-hint: '[optional: what to look at first, like 001.refactoring.name or the WebSocket events]'
disable-model-invocation: true
model: opus
effort: max
---

# Architecture survey

`docs/system/` is the picture of production up to one commit of `main`, the one each document's header names. This skill rebuilds it from its sources; the first run creates it (`docs/system/README.md`). It runs on demand, not per pull request: when the user wants to see, refresh or understand the architecture, or when `/pull-request` says the picture fell behind. Between two pictures, every change reaches `main` by a merged pull request, whose body records its review, and `/pull-request` keeps the glossary's terms current (`docs/process/go-live.md`, section 2).

The processes this belongs to are `docs/process/go-live.md` and `docs/process/feature-closing.md`; the glossary follows `docs/patterns/ubiquitous-language.md`.

## Authorization

This skill carries **no authorization**. At the end it shows what changed and asks for the commit, like any other ("Repo: davna"), and it never pushes. That commit reaches `main` by a docs pull request that `/pull-request`, which only the user runs, prepares: a docs-only change deploys nothing ([path-filtered pipelines](../../../docs/patterns/ci-triggers.md)), and its review is the short one of `docs/process/pull-requests.md`, section 3.8.

Against production, it only reads, and what only the user can reach (the server, the registry, the Vercel panel, the provider consoles) the user runs and shares (`docs/process/production-procedures.md`, section 2). It never reads a secret's value nor opens a `.env` file.

## Steps

### 1. Check the ground

- **The repository and the branch.** `git rev-parse --show-toplevel` ends in `davna`; the main folder, on `main` updated from `origin/main` (`git pull --ff-only origin main`): the survey reads that commit, and `docs/system/` and its diagrams change only from the main folder, on a `docs/production-picture-<short sha>` branch cut from it right before the commit (`docs/process/parallel-features.md`, sections 2 and 5). If unsure, ask.
- **A clean tree.** `git status` must show nothing this skill didn't write. If there are other changes, stop and ask: they don't go into its commit.
- **The commit it describes:** `git rev-parse --short HEAD`, the tip of `main`, equal to `origin/main` after the pull. What `main` has and production may not have yet (merged but not deployed) is not drift: say it in the report. Production is updated by hand today (`docs/process/go-live.md`, section 2), so also ask the user which commit the running images and the last Vercel deploy were built from.
- **Read what is there:** every file in `docs/system/`, and the design drawings in `docs/project/` (`system.architecture.drawio`, `database.models.drawio`, `use.cases.drawio`), which the picture cites without changing.

### 2. Find what changed since the last picture

- **The last picture:** the commit the header of `docs/system/overview.md` names ("up to commit `<sha>`"). With no `overview.md`, this is the first picture: everything is new, and the sources of step 3 are read in full.
- **The pull requests since then:** the merge commits after it (`git log --merges --first-parent --oneline <sha>..origin/main`, each titled with its PR number) and the merged PRs (`gh pr list --state merged --search "merged:>=YYYY-MM-DD"` with the picture's date, and `gh pr view <n>` for each body). Each PR body says what it advanced and what its review found; read the folders of the features, refactorings and improvements they shipped (stages 4 to 7 and the stage 9 checklist, or the definition, plan and implementation checklist) and the argument, when the user gave one.
- **The PRs point, the sources prove.** They say where to look first. Every fact still comes from its source (step 3), and drift can be anywhere.

### 3. Survey production

Rebuild the facts from their sources, not from the stages or the PRs: the code on `main` at the commit of step 1, the collections, indexes and validators that code produces in the local MongoDB, and the live production, read-only. Every document ends with a "Where it comes from" table naming its sources, and `references/survey.md` has the commands and reads.

Look for what changed and also for what drifted: a container running an image no commit built, a variable on the server that `.env.example` doesn't name, a Vercel setting the repository doesn't know, an index made by hand, a retention that contradicts the privacy policy. Drift is a finding. It goes into the "Drift" section of `infrastructure.md` and to the user, never silently "fixed" in the docs or in production.

### 4. Update `docs/system/`

- **The documents** (`docs/system/README.md`, "What it will hold"): `overview.md`, `architecture.md`, `data-model.md`, `use-cases.md`, `apis.md`, `access-control.md` and `infrastructure.md`. The glossary, `language.md`, is step 5. The README stays; once the picture exists, its "Nothing here exists yet" sentence goes.
- **The header.** Every document opens with "Production picture on YYYY-MM-DD, up to commit `<short sha>`": the date of the survey and the commit of step 1. Then it names what changed since the last picture: the features, refactorings, improvements and fixes the merged pull requests brought.
- **The overview.** A new feature gets a row in "What is in production". A new component gets a row in the components table. A refactoring changes the rows it renames or reshapes.
- **What is, not what is planned.** Write only what the commit of step 1 has, and say what doesn't run (a package that doesn't compile, an image that can't be built), with its register item in `docs/recommendations.md`. What is specified but not shipped stays in `docs/features/`, `docs/refactorings/` or `docs/improvements/`.
- **The house style.** Write in English, with the terms of the glossary (`docs/system/language.md`); the words the screen shows are pt-BR, as `apps/client.app` writes them, and are quoted as such. Keep each document's structure, and keep the "Where it comes from" tables current.
- **Never a secret's value.** Variable names and types only.
- **davna stands alone.** The picture describes davna; projects that build on it are mentioned only generically, as consumers of its exported packages and ports.
- **New ground.** A new kind of fact gets a section in the closest document. Create a new document only when no existing one fits, and add it to the overview's list and to `docs/system/README.md`.

### 5. Check the whole glossary

`docs/system/language.md` holds the vocabulary of what is in production ([ubiquitous language](../../../docs/patterns/ubiquitous-language.md)). `/pull-request` brings each change's terms per pull request; this is the full check. Follow `references/survey.md`, "The glossary":

- **The terms since the last picture.** Every change shipped since then has its accepted terms in their context, with the name in the code, the word on screen, the words not to use and the meaning. Bring what is missing; a term whose code didn't ship stays out.
- **The names in the code.** The "In the code" column matches the code of step 1.
- **The legacy names.** Each row has its register item and trigger; a rename done since the last picture removes its row.
- **The check.** Search the code and the docs for each context's "Do not use" words and for legacy names without a register. A hit is a finding for the user, like drift: never a silent rename.
- **The header** gets the date and the commit, like the others, and takes in the lines `/pull-request` added below it.

### 6. Update the images

When collections, relations, components or flows changed, update `architecture.svg` and `data-model.svg` (or draw them, on the first picture). Follow `references/diagrams.md`:

- keep the names, the structure, the palette and the size limit;
- validate the XML;
- look at the result in the browser pane;
- check overflow with the script there.

The images are committed with the documents: there is no store for media outside git yet (`docs/recommendations.md`, RG12).

### 7. Sweep the rest

Run the state sweep from the `feature-workflow` skill (section 5), and the refactoring sweep of `refactoring-workflow` for the old names of a refactoring shipped since the last picture: the docs that a picture of production makes false. The `CLAUDE.md` files hold no state: a state sentence found in one moves to the change's docs, and the `CLAUDE.md` only changes when a rule, a command, a convention or a trap did. Ticking the go-live is `/pull-request`'s: a go-live item found done and unticked is a finding for the report. A finding that belongs to no change goes to the report as a proposed `RGnn` item for `docs/recommendations.md`, written only with the user's yes.

### 8. Check before asking for the commit

- **Every relative link** in `docs/system/` resolves.
- **The tables and their columns** match the survey. Re-read each changed row against its source.
- **No secret** got into a document: no tokens, keys, passwords or connection strings, and no personal data from production.
- **The format:** `yarn prettier --write --end-of-line lf` on the Markdown it touched (Prettier comes with `@davna/eslint`; if dependencies are not installed, say so).
- **The tests,** only if anything outside the docs changed (`yarn workspace @davna/<package> test`, `yarn test:modules`). A docs-only commit can't break them.

### 9. Ask for the commit

Show the user what changed (the documents, the diagrams, the glossary) and the findings, and ask for the commit ("Repo: davna"), on the `docs/production-picture-<short sha>` branch. It carries only the documentation: `docs/system/`, its two images, and the docs and `CLAUDE.md` files the sweep touched. Use the message `docs: production picture up to <short sha>`, with the attribution lines the session provides.

Then tell the user that it reaches `main` by a docs pull request that `/pull-request` prepares, which only they run, and that pushing the branch and merging the PR each need their own yes.

### 10. Report

What the docs now say and the commit they describe, the findings (drift, the glossary, go-live items left unticked, proposed `RGnn` items), what `main` has that production doesn't yet, and what you could not verify, such as a server read or a panel the user didn't share.
