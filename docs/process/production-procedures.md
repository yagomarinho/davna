# Production procedures

How to write and run a step that touches production: a manual procedure (a data change in MongoDB, a server update with `docker-compose.prod.yml`, a Vercel setting), a step of the [go-live](go-live.md) or a one-off fix.

---

# 1. Each step

- **What and why,** in one line.
- **The command,** ready to paste into the terminal of whoever administers. Names that a tool generates (container ids, image digests, deployment URLs) are looked up (`docker compose -f docker-compose.prod.yml ps`, `docker image ls`), never typed by hand.
- **The expected output,** literal, next to the command: `true`, `64`, `healthy`, `201`, `{ acknowledged: true, modifiedCount: 3 }`.
- **How long to wait,** when the change does not apply at once (DNS propagation, a container still `starting` before it becomes `healthy`, a Vercel deployment still building), and how to see that it applied.
- **What else it affects** besides the target, and how to undo it.
- **"Not exercised",** until it runs for real once in production. After the first run, the mark goes away or the step is corrected.

A procedure is a hypothesis until it runs: only a real run shows whether the step does what the plan says.

---

# 2. Who runs it

- **Writes to production and secrets belong to the user.** The agent prepares the command and checks the result through the logs (`docker compose logs`), the health endpoints (`/health`), the metrics and the metadata.
- **The effect of each step is stated:** read, reversible, irreversible or write to production.
- **An irreversible step is rehearsed first,** when possible: a deletion or a bulk update in MongoDB first runs its filter with `countDocuments` (or `find` with a projection) and compares the count with the expected one, and, when the change is large, it runs against a copy restored in the local Mongo of `docker-compose.yml` (`mongodump` / `mongorestore`); only then for real. A backup (`mongodump`) of the affected collections comes before it.

---

# 3. Secrets

- **The value stays in a terminal variable,** never on the screen, nor in the chat. It goes from one command to another through the variable or the clipboard.
- **The check is by length, by prefix, by name** (the variable exists in the `.env` of the server, in the Vercel project) **or by a `true`.**
- **At the end,** the variables and the clipboard are cleared.
- **The agent never reads a secret,** even when the session's credentials would allow it, and never opens a `.env` file. It reads only metadata: names, types and dates.
- **Broad credentials on the machine,** such as a cloud root account or the database's admin user, change nothing in this. A minimal permission for day-to-day work is recommended.

---

# 4. Assumptions about third parties

How a provider retries a call, how long a change takes to apply, what a test button actually sends, what a model of OpenAI returns for a given input, how Firebase reports an expired token: these are assumptions, not facts of the plan. Each one is written with the way to check it and, once checked, gets the result.

---

The other processes: [Feature stages](feature-stages.md), [Findings and decisions](findings-and-decisions.md), [Gates](gates.md), [Pull requests](pull-requests.md), [Go-live](go-live.md), [Feature closing](feature-closing.md), [Parallel features](parallel-features.md), [Refactorings](refactoring.md) and [Improvements](improvements.md).
