# Image before go-live

**Status:** Proposed on 2026-11-10, brought from the author's pattern catalog and adapted to davna's deploy (Docker images of the backend apps, run on a server with `docker-compose.prod.yml`).

## Problem

The backend apps go to production as Docker images: `apps/monolith.api` and `apps/multimedia.processing` today, and `apps/interaction.conductor` when it has a working image. An error in an image only shows when it is built or when its container starts:

- the build bundles every workspace the app imports, runs tests inside the build stage and compiles with esbuild, so a stale package name or path breaks it;
- the runtime stage copies files and scripts (`wait-for*.sh`, `temp/`) from the build stage, so a missing file breaks the start;
- the container waits for MongoDB and for the media service's `/health` (`scripts/wait-for.sh`) and reads the server's `.env`, so a missing variable or a broken dependency only shows at the start.

None of these depends on the deploy. If the image is first built during the go-live, each error becomes time with production down or running old code; if it is built and started before, production keeps answering with the previous image while the error is fixed.

## Decision

**The image comes first.** Every change that touches a backend app only enters the go-live after its image is built from the change's commit, started and healthy. That covers:

- the app's code and every workspace it bundles (`shared/*`, `modules/*`, `services/*`);
- its `Dockerfile`, its `build.js`, the scripts it copies and the root `package.json` and `yarn.lock`;
- the contract between the API and the media service (routes, payloads, the API key header).

"Built, started and healthy" means the three things:

1. **the build green:** `docker build -f apps/<app>/Dockerfile .` from the repository root, including the tests the build stage runs;
2. **the start:** the image runs with a test `.env` (local Docker stack or a test host), passes its `wait-for` checks and answers `GET /health` (`modules/system.monitoring`);
3. **the tag written down:** the image is tagged with the commit (an immutable tag, never only `latest`), and that tag goes into the "Prepare" group of the go-live list. It is that tag, and no other, that production runs at "Turn on".

## How it works

1. **The image is born before the merge,** from the change's branch, with the commit's tag. The user builds and pushes it to the registry (or a pipeline does, once one exists, filtered by path; [Path-filtered pipelines](ci-triggers.md)).
2. **The start check** runs the image against a test environment, never against production's data; the container's log shows the `wait-for` steps and the `/health` answer.
3. **The gate.** The item "the image built, started and healthy, with its tag" stays in the "Prepare" group of the go-live list. Without it ticked, the merge of the pull request that takes the code to production is not requested ([Go-live](../process/go-live.md); [Pull requests](../process/pull-requests.md), section 3.7).
4. **Production pulls the tag.** `docker-compose.prod.yml` names the image by the tag written in "Prepare" (through a variable of the server's `.env`, not a literal), and the user recreates the containers.

## Limits

- The start check proves the image and its configuration, not the full flow with real providers (OpenAI, S3, Firebase): that is still checked at "Turn on", but with an image known to be good.
- `apps/client.app` is not an image: Vercel builds it. Its equivalent is a preview deploy of the branch, checked before the merge.

## Discarded alternatives

- **Building the image at deploy time:** each image error becomes time with production down.
- **Trusting only the tests:** none of them builds the image, copies the scripts or starts the container.
- **Running `latest` in production:** what runs is whatever was pushed last, not a known commit, and a rollback has no tag to go back to.

## Where it is in the code

Not in the code yet. The pieces it builds on:

- `apps/monolith.api/Dockerfile`, `apps/multimedia.processing/Dockerfile` and `apps/interaction.conductor/Dockerfile` (two stages: build with tests, then runtime);
- `docker-compose.prod.yml` (the production containers, their health checks and the `wait-for` entrypoint) and `docker-compose.yml` (the local stack);
- `scripts/wait-for.sh`, `scripts/wait-for-mongo.sh` and `scripts/wait-for-http-health.sh`;
- the `/health` route of each app, from `modules/system.monitoring`.

## Known deviations

- **The images cannot be built today.** The Dockerfiles still name the old packages and paths (`apps/api`, `apps/ffmpeg`, `@davna/api`, `@davna/classroom`, `@davna/feedback`), and `apps/interaction.conductor/Dockerfile` is a copy of the media service's.
- **`latest` in production.** `docker-compose.prod.yml` pulls the images with the `:latest` tag, from image names written in the file instead of configuration.
- **The local compose builds from stale paths** (`docker-compose.yml` builds `./apps/ffmpeg/Dockerfile`).
