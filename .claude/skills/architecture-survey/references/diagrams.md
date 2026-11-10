# The two images

`docs/system/architecture.svg` and `docs/system/data-model.svg` are hand-maintained SVG, created by the first `/architecture-survey`. There is no store for media outside git yet (`docs/recommendations.md`, RG12), so both are committed with the rest of `docs/system/`, and GitHub renders them inside the `.md` files. They are the picture of production; the original design drawings in `docs/project/*.drawio` stay as they are, and the picture says where production differs from them (`docs/system/README.md`, "Rules").

## Limits

- **Stable names.** Other documents link these two paths; keep them.
- **Small.** Keep each file under 100 KB: every version stays in git's history.
- **Self-contained.** No external fonts, no linked or embedded raster images, no scripts, no `foreignObject`. The fonts are system stacks (`'Segoe UI', 'Helvetica Neue', Arial, sans-serif` and `Consolas, 'DejaVu Sans Mono', Menlo, monospace`), so the file renders the same in a browser, an editor preview, GitHub or an image viewer.
- **Readable on any background.** The first element is a full white `rect`; the text colors assume it.
- **Accessible.** The root has `role="img"`, a `<title>` and a `<desc>`; update both with the date.

## Structure

Both files are organized for editing by hand:

- **`data-model.svg`:** `<g id="relations">` holds one `<polyline id="r-<from>-<to>">` per relation (a stored reference, or a graph edge between two vertices), drawn before the boxes so the boxes cover the line ends. `<g id="collections">` holds one `<g id="c-<module>-<collection>" transform="translate(x,y)">` per collection, GridFS bucket or spreadsheet; a graph vertex or edge stored in a collection of its own gets its own box.
  - **Grid:** boxes are 270 px wide, in columns at x = 40, 370, 700, 1030 and 1360. The header is 26 px, each row (one field) 20 px.
  - **Row center:** row *i* is centered at `y + 40 + 20i`, which is where a relation line should meet the box edge.
  - **Corridors:** relation lines run in the gaps between columns.
  - **Edges of the graph** (`OccursIn`, `Ownership`, `Participation`, `Representation`, `Source`, `Usage`, `Granted`, `PolicyAggregate` in `modules/classroom.management` today) are drawn dashed, with the edge's name on the line, so they are not read as references inside a document.
- **`architecture.svg`:**
  - `<g id="zones">`: one rounded `rect` per host or provider (the server with `docker-compose.prod.yml`, Vercel, the MongoDB host, AWS S3, OpenAI, Firebase, Google Cloud, the browser).
  - `<g id="arrows">`: one `<polyline id="a-<from>-<to>">` per arrow.
  - `<g id="boxes">`: one `<g id="b-<component>">` per component (an app, a container, a provider's service).
  - `<g id="labels">`: the arrow labels and the numbered flow badges.
  - `<g id="legend">`: the legend.
  - **Arrow colors:** each flow keeps its color and its arrowhead marker (`m-f1` … `m-f7`, `m-data`). The numbers match the flows in `architecture.md`.

## Palette

| Use                          | Color                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Modules (box headers)        | `identity.access` `#546E7A`, `access.control` `#1F4E79`, `classroom.management` `#2E7D32`, `costumers.insights` `#9C4A00`, storage `#6A1B9A` |
| Key and reference badges     | `#FFF1C2` with `#6D4C00` (the id); `#DCEBFA` with `#0D3C78` (a reference)                                                                   |
| Flows                        | 1 `#7B1FA2`, 2 `#2E7D32`, 3 `#1565C0`, 4 `#D84315`, 5 `#616161`, 7 `#C62828`, data `#455A64`                                                |
| Zones                        | server `#EEF3FC` / `#7FA7E0`, Vercel `#F4F4F4` / `#9E9E9E`, MongoDB `#EDF8F1` / `#3ECF8E`, AWS `#FFF7EE` / `#F0A04B`, other providers and people greys |

A new module or flow gets a new color that keeps white text readable on it (contrast of at least 4.5:1). The module names follow the code until the glossary renames them; a rename the glossary defers keeps the legacy name, as `costumers.insights` does (`docs/recommendations.md`, RG07).

## Changing them

1. **Small change** (a field, a box, an arrow): edit the SVG directly, following the grid. **Layout change** (a new column of boxes, a new zone) or the first drawing: it is fine to generate the whole file with a throwaway script in the scratchpad, keeping the structure, ids, sizes and palette above. Never commit the script.
2. **Validate the XML** in the browser pane, after `navigate` to the file (step 3): this returns `null` when the file parses, or the parser's message when it doesn't:
   ```js
   new DOMParser()
     .parseFromString(await (await fetch(location.href)).text(), 'image/svg+xml')
     .querySelector('parsererror')?.textContent ?? null
   ```
3. **Look at it** in the browser pane: `navigate` to `file:///<repo>/docs/system/<file>.svg`, then scroll with `window.scrollTo(x, y)` and take screenshots at 1:1. A larger emulated viewport shrinks the screenshot past reading.
4. **Check overflow and overlaps with a script,** rather than by eye:
   ```js
   const issues = []
   document.querySelectorAll('#boxes > g').forEach(g => {
     const r = g.querySelector('rect').getBBox()
     g.querySelectorAll('text').forEach(t => {
       const b = t.getBBox()
       if (b.x + b.width > r.x + r.width - 6) issues.push([g.id, t.textContent])
     })
   })
   issues
   ```
   For `data-model.svg`, use `#collections > g`. Each box's `rect` is then in local coordinates, the same as its text. Also check that no arrow label (`#labels text`) overlaps a box `rect`.
5. **Check the size:** `ls -la docs/system/*.svg`.
