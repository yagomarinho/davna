# Pull request, deploy and go-live

## The go-live section of stage 9

Write it at the end of `9.implementation.checklist.md` when stage 9's code is done. It comes from stage 7 (the manual setup, the validation plan, what comes after the deploy), and its four groups are those of `docs/process/go-live.md`, section 1. Keep it current as items get done, because it is what you answer from when the user asks for the list.

```markdown
## Go-live

### Prepare

- [ ] <what> — **who:** user · **effect:** write to production · **check:** <expected output>
- [ ] The image of `apps/<app>` built from `<commit>`, started against a test `.env` and answering `/health`; tag `<tag>` — **who:** user · **effect:** reversible · **check:** `docker compose ... ps` shows `healthy`

### Ship

- [ ] `feat/<name>` synced with `origin/main` by merge (`chore: sync feat/<name> with main`), with the checks green, with the user's authorization (`docs/process/parallel-features.md`, section 5)
- [ ] `/pull-request`: the local checks, the sweep and the go-live ticks, the feature's terms in the glossary, the PR body from `.github/pull_request_template.md` checked with `node scripts/pr-review.js check-body` — **who:** user
- [ ] The branch pushed and the pull request opened (`gh pr create --title ... --body-file ...`), with the user's authorization
- [ ] The self-review: `/code-review --comment` on the PR, each comment answered and resolved; the required checks (`pr-body`, `scripts`, `license-header`) green
- [ ] The PR merged with a merge commit (`gh pr merge <n> --merge`), with the user's authorization — **blocks:** everything below
- [ ] The main folder back on an updated `main` (`git switch main`, `git pull --ff-only origin main`)
- [ ] The ignored files that only the worktree has copied to the same paths in the main folder, when the work needs them (`git -C "$WORKTREES_ROOT/davna/<name>" ls-files --others --ignored --exclude-standard -- docs`)
- [ ] The worktree and `feat/<name>` removed right after the merge: `node scripts/worktree.js remove <name>`
- [ ] `feat/<name>` deleted on `origin`: the `git push origin --delete feat/<name>` command the script printed, with the user's authorization
- [ ] The server: pull the new tag and recreate the containers with `docker-compose.prod.yml` — **who:** user · **effect:** write to production · **check:** every container `healthy`, `/health` answers

### Turn on

(in sequence, without a pause: <why>)

- [ ] ...

### After

- [ ] ...
```

- A done item gets `[x]` and the date, and stays.
- A waived item keeps `[ ]` and gets "**Waived** on YYYY-MM-DD by the user: the reason" (`docs/process/gates.md`, section 3).
- In the conversation, show only the pending ones (SKILL.md, section 7).
- The order between the API images and the client deployment is written in "Ship" when the change is not additive (`docs/process/go-live.md`, section 2).

## After the merge

`git worktree remove` deletes ignored files without a warning. Before the worktree goes, list the ignored files only the worktree has with `git -C "$WORKTREES_ROOT/davna/<name>" ls-files --others --ignored --exclude-standard -- docs`, copy the ones the main folder needs (a wireframe kept out of git) to the same paths, and check each with `cmp` and `git check-ignore -v`. The `.env` files copied into the worktree are not copied back: the main folder has its own.

Right after the pull request is merged into `main` and the main folder pulled it, the feature's worktree and `feat/<name>` go (`docs/process/parallel-features.md`, section 10): `node scripts/worktree.js remove <name>`, from the main folder, after the worktree's session has ended, with the user's yes. The script refuses a dirty worktree or an unmerged branch and deletes the branch with `git branch -d`, never `-D`: git refuses to delete a branch with commits that aren't in `main`, and that refusal is a finding to look into, not to force. Nothing is lost: the pull request's merge commit keeps the feature's history and still reverts it whole (`git revert -m 1`). The script never deletes the branch on `origin`: it prints `git push origin --delete feat/<name>`, which goes after the merge and, being a push, needs the user's authorization. A fix found later in the go-live goes on a new `fix/<name>` branch and its own pull request, never on a revived branch.

The final check: `node scripts/worktree.js list` and `git worktree list` without the worktree, `git branch -a` without the branch, and, after the remote deletion, `git ls-remote --heads origin` without it.

## The procedure template

Each step of a manual procedure or go-live step (`docs/process/production-procedures.md`, section 1):

1. **What and why,** in one line.
2. **The command,** ready to paste, in the shell of whoever runs it: PowerShell or Git Bash on this machine, the server's shell for the compose. Names a tool generates (container ids, image digests, deployment URLs) are looked up, never typed by hand:
   ```bash
   docker compose -f docker-compose.prod.yml ps --format '{{.Name}} {{.Image}} {{.Status}}'
   docker image ls --format '{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedSince}}'
   ```
3. **The expected output,** literally: `true`, `64`, `healthy`, `201`, `{ acknowledged: true, modifiedCount: 3 }`.
4. **How long to wait** when the change propagates (a container still `starting`, a Vercel deployment still building, DNS), and how to see that it applied.
5. **The effect** (read, reversible, irreversible, write to production), **what it affects besides the target,** and how to undo it. An irreversible MongoDB step runs its filter with `countDocuments` first, after a `mongodump` of the affected collections (`docs/process/production-procedures.md`, section 2).
6. **"Not exercised"** until it has run once in production. Remove the mark, or fix the step, after it runs.

## Secrets

The user handles every secret; you never see a value (`docs/process/production-procedures.md`, section 3).

- **Holding a secret:** in a shell variable, never on screen, never in the chat:
  ```powershell
  $token = Get-Clipboard
  $token.Length   # only the length is shown
  ```
- **Passing a secret to a command:** through the variable or the clipboard, never typed into the chat or written into a file of the repository.
- **Checking it:** by name (the variable exists in the server's `.env`, in the Vercel project), length, prefix or a `true`. You may read metadata: names, types and dates. Never open a `.env` file; `.env.example` lists the names.
- **At the end:** `Remove-Variable token` and `Set-Clipboard -Value ' '`.
- Broad credentials on the machine (a cloud root account, MongoDB's admin user) change nothing in this: what protects the secret is that you don't read it. Recommend least-privilege credentials when it comes up.
- Some production writes are refused to you by the permission classifier. Don't look for another route: give the user the command to run, then check the result.

## When something doesn't arrive

Walk the path in order and stop where it breaks. Example: a student's audio message that gets no reply in the classroom.

1. **The client sent it?** The browser's network panel and the Vercel function logs of `apps/client.app/src/app/api/*`, which proxy to the API (the user reads the Vercel panel).
2. **The API received it?** `docker compose -f docker-compose.prod.yml logs --since 15m api` on the server, by route or socket event (the user runs it on the server, or shares the output).
3. **The API is healthy?** `/health` of the API and of the media service, and `docker compose ... ps` for `healthy`.
4. **The media service converted it?** `docker compose ... logs --since 15m ffmpeg`, for `/convert` and `/metadata`.
5. **The provider answered?** The API's log for the OpenAI call, then the provider's own console for errors and limits (the user reads it).
6. **It was stored?** `countDocuments` on the messages of that classroom in MongoDB, and the audio in GridFS or S3, by id (read-only, run by the user against production).

Logs rotate and consoles lag by minutes. Re-check before concluding that nothing arrived.

## Cautions for davna's deploy

These come from the repository's known state (`docs/recommendations.md`) and from the patterns; each feature that learns a new one adds it here.

- **The images cannot be built today.** The Dockerfiles and `docker-compose.yml` still name old packages and paths (`docs/recommendations.md`, RG03). A feature that ships an image fixes, or depends on a change that fixed, its Dockerfile first.
- **`latest` is not a version.** `docker-compose.prod.yml` pulls `:latest`; until it takes the tag from configuration, write the exact tag in "Prepare" and check, after the pull, that the running image's id is the one built from the commit ([image before go-live](../../../../docs/patterns/image-before-go-live.md)).
- **Fixed container names and ports.** Both compose files fix `mongo`, `ffmpeg` and `api` and their ports, so only one stack runs per machine (`docs/process/parallel-features.md`, section 7).
- **Silent defaults.** Configuration falls back to development values when a variable is missing (`docs/recommendations.md`, RG05 and RG06): a server without a variable starts and runs with the wrong value. Check every variable the change reads, by name, before the merge.
- **Vercel variables need a redeploy.** A variable changed in the panel changes no file, so it triggers no build ([path-filtered pipelines](../../../../docs/patterns/ci-triggers.md), "Limits"); a `NEXT_PUBLIC_*` value goes to the browser.
- **Git Bash rewrites arguments** that start with `/` into Windows paths. Prefix the command with `MSYS_NO_PATHCONV=1`, or use PowerShell.
- **Test data after go-live.** Delete it with the same code paths a deletion request uses, plus what they don't cover, rehearsed with `countDocuments` and a backup first (`docs/process/feature-closing.md`, section 2).

## After the go-live

1. Sweep the docs for stale state (SKILL.md, section 5). A post-deploy data change or fix goes to `main` by its own pull request, prepared by `/pull-request`, like any change. `docs/system/` isn't refreshed per feature: when `/pull-request` says the picture is behind, or production changed by hand, suggest `/architecture-survey` to the user.
2. The manual procedures lose the turn-on steps and the test-record steps; the diagnosis that stays useful stays, in a section of its own (`docs/process/feature-closing.md`, section 2).
3. The post-deploy data changes (tightening a validator, dropping a field or an index) go in, tried against the local Mongo first (`docs/process/feature-closing.md`, section 3).
4. Waived items and pending reviews stay listed in the checklist for the next round.
5. The `RGnn` items the feature took become accepted in `docs/recommendations.md`, pointing to the decision that resolved them (`docs/process/feature-closing.md`, section 1).
6. Lessons that would help the next feature go into this file, or into `docs/patterns/` if they are a reusable solution rather than an operational caution.
