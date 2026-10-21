# The website, the build, the workflow and the update rules

## Pages of the website

| Page | Content |
|---|---|
| Home | The project name and the lead paragraph of the record README. A "Now" section: the current milestone, the next milestone and the date. A strip of the milestones in order, with their states. Counts of decisions by each person, by Claude Code and by Unknown. Links to the repository and to the other pages. |
| Records | A table of all documents in `replication_materials/`, in the order of the date in the file name. Columns: date, title, kind, status, milestone, size, links. Filter buttons by kind. Each title links to its document page. |
| Decisions | All decisions: the rows of `decisions.md` and the `Ruling:` lines of the ledgers. Columns: ID, date, decision, proposed by, decided by, how, evidence, source document. The optional columns add the time, the topic, the impact and the decisions replaced. A classified decision without a check shows "not checked by a person". Filter buttons by "decided by" and by "how". A corrected record shows the new values and "Corrected by {name}, {date}". |
| Progress | The milestones with their states and plans. The open items and blockers from `roadmap.md`. For each plan with a ledger: the tasks complete out of the tasks in the plan. A plan without a ledger shows `-`. A table of paid calls. |
| Contributions | The text of `project/contributions.md` and its Item/Value table (Status, Written by, Approved by). |
| Timeline | The decisions, the releases and the results in one order of time. |
| Releases | One row for each release in `releases.md`, with its decisions and results. Only when `releases.md` exists. |
| Results | One row for each result in `results.md`, with its release, source and decisions. A replaced result shows the result that replaces it. Only when `results.md` exists. |
| Process | The events of `process.md` by date, and a second view grouped by stage. |
| Document pages | One page for each markdown file in `plans/`, `findings/`, `probes/` and `calls/`, and for the record README. |
| Extra pages | The files in `pages` of `.replication/site.config.json`, for example a rendered analysis. Each file is copied as it is to `pages/<file name>`. The navigation and the Home page link to each one. |

The navigation order is: Home, Records, Decisions, Contributions, Timeline, Releases, Results, Progress, Process, extra pages, Repository.

The footer of each page says "Built from commit {sha} on {date}." It links to the repository.

## Appearance

- The pages use serif headings, a sans-serif body and a contents rail on wide screens.
- There is one theme: light. The page sets `color-scheme: light`.
- The colour tokens are on `:root`. The default tokens use the Miami University palette:

| Token | Use | Colour |
|---|---|---|
| `--bg` | page background | Warm White `#FAF9F7` |
| `--surface` | cards, tables, header | White `#FFFFFF` |
| `--tan` | table heads, the selected item | Light Tan `#EDECE2` |
| `--ink` | body text | Black `#000000` |
| `--muted` | secondary text | Medium Gray `#666666` |
| `--rule` | lines between items (decoration only) | Medium Tan `#CCC9B8` |
| `--accent` | links, heading marks, focus ring, the masthead band | Miami Red `#C41230` |
| `--accent-strong` | link hover, pressed buttons | Accent Red `#AD102A` |
| `--on-accent` | text on the red band and on pressed buttons | White `#FFFFFF` |

- Text uses only the pairings of the brand guide.
- Text on Warm White, White or Light Tan: Black, Miami Red, Accent Red, Medium Gray, Dark Tan or Slate Blue.
- Text on Miami Red or Accent Red: White, Warm White or Light Tan.
- The colours are at 100% opacity, with no tints or shades.
- A project of another organization can replace tokens with `theme` in `.replication/site.config.json`. The keys are the token names without `--`:

```json
{
  "project": "My study",
  "repository": "https://github.com/owner/my-study",
  "format_version": 1,
  "theme": { "accent": "#00563F", "accent-strong": "#003D2C" }
}
```

- New tokens must keep the contrast rules below.
- The build checks `site.config.json` and stops on a bad value:
  - `project` is a text that is not empty.
  - `repository` is `https://github.com/<owner>/<repo>`, with no `/` at the end.
  - Each `theme` key is a token name. Each `theme` value is `#RRGGBB`.
  - `pages`, if it is there, follows the rules of the next section.

## Extra pages

- `pages` in `site.config.json` lists files that the website shows as they are. An example is the HTML of a Quarto analysis:

```json
{
  "project": "My study",
  "repository": "https://github.com/owner/my-study",
  "format_version": 1,
  "pages": [{ "file": "analysis.html", "title": "Analysis" }]
}
```

- `file` is a path from the project root, with `/` between folders. It has no `..`, no `\` and no drive letter.
- The file must exist. Two files must not have the same file name.
- `title` is a text that is not empty. It is the link text in the navigation and on the Home page.
- The build copies each file, byte for byte, to `pages/<file name>`. It copies nothing else.
- So a file must be self-contained. In Quarto, use `embed-resources: true`. In R Markdown, use `self_contained: true`.
- The build does not change or check the content of an extra page. Its accessibility and its links are the work of the project.
- A build script of version 1.0.0 ignores `pages`. `format_version` stays 1.

## Accessibility: WCAG 2.2 AA

- Contrast: 4.5:1 for text. 3:1 for large text, for the parts of controls and for focus indicators (1.4.3, 1.4.11).
- The page reflows at 320 CSS px, with no horizontal scroll of the page (1.4.10).
- The page has a 16 px side gutter. The text stays usable at 200% zoom (1.4.4).
- A wide table scrolls inside its own box. The box can get keyboard focus (`tabindex="0"` with a label).
- Each filter button, navigation link and table link has a target of at least 24 × 24 CSS px (2.5.8).
- A sticky header or rail never hides a focused element (2.4.11). The page uses `scroll-padding-top`. The header is not sticky on small screens.
- The focus ring is 3 px Miami Red with an offset (2.4.7).
- Filter buttons are `<button>` elements with `aria-pressed`. The count of shown rows is in a polite live region (4.1.2, 4.1.3).
- Tables have `<th scope>` and a caption. Each page has `lang`, a unique `<title>`, one `<h1>`, landmarks and a skip link (1.3.1, 2.4.1, 2.4.2).
- Colour is never the only sign of a state. Each milestone state also has a text label (1.4.1).
- Smooth scrolling occurs only when `prefers-reduced-motion` permits it.

## Build

- Command: `node .replication/build-site.mjs --out <folder>`. `--root` gives the project root. The default is `.`.
- The build uses Node 22 and no npm packages. It does not need the network.
- `--out` must be a new folder, an empty folder, or a folder with an earlier site. Else the build stops.
- A site from any version of the skill counts as an earlier site.
- For a check, build into a temporary folder outside the repository: `--out "$(mktemp -d)"`.
- Success prints `Wrote <n> pages to <folder>.` and exits 0. With extra pages, it prints `Wrote <n> pages and <k> extra pages to <folder>.`
- An error prints `replication-materials: <file>:<line>: <detail>` and exits 1. The file is relative to `replication_materials/`.
- The build stops when a record table does not have the columns of `record-formats.md`. The message names the file and the line.
- `git log` is optional. Without git, the build uses the dates in the file names. In CI, `GIT_SHA` gives the commit for the footer.
- Each HTML page is a full document with `<!doctype html>`, charset and viewport.
- Each page embeds its markdown as JSON in a `<script type="application/json">` tag, with `<` escaped.
- The browser renders the markdown with marked 12.0.2, KaTeX 0.16.9 and DOMPurify 3.4.16 from cdnjs. Each script tag has a Subresource Integrity hash.
- DOMPurify removes HTML tags from the markdown. Text such as `<topic>` outside a code span disappears. Write fill-in markers as `[...]`.
- Math between `$...$` (on one line) or `$$...$$` goes to KaTeX as written. marked does not change it.
- A task-list checkbox (`- [ ]`, `- [x]`) gets the name "Not done" or "Done" for screen readers.
- A relative link to a record document goes to its page. Another relative link goes to the file on GitHub.
- A relative image loads from `https://raw.githubusercontent.com/<owner>/<repo>/main/replication_materials/`. This works only in a public repository.
- Without JavaScript, the page shows the markdown as plain text.

## Workflow

The file is `.github/workflows/replication-site.yml`.

- Triggers: each push to `main`, and `workflow_dispatch`. There is no path filter, because an extra page can be anywhere in the project.
- Permissions: none at the top level. The build job has `contents: read`. The deploy job has `pages: write` and `id-token: write`.
- Concurrency group `pages`. A new run does not cancel a running deploy.
- Each action is pinned to a full commit SHA, with the tag in a comment.
- The first line is the version line, for example `# replication-materials 1.2.0`.
- The workflow and the links of the website use the branch `main`. Set-up stops when the default branch is not `main`.
- Check the run of the pushed commit: `gh run list --workflow replication-site.yml --commit "$(git rev-parse HEAD)" --limit 1`.
- After the first push, if no run has started within 60 seconds, start it: `gh workflow run replication-site.yml --ref main`.
- The workflow template has `workflow_dispatch`, so this command works.
- Wait for the run of the pushed commit to end:

```bash
gh run watch "$(gh run list --workflow replication-site.yml --commit "$(git rev-parse HEAD)" --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```

## GitHub Pages

1. Turn on Pages: `gh api -X POST repos/{owner}/{repo}/pages -f build_type=workflow`.
2. HTTP 409 means that Pages exists. Read it: `gh api repos/{owner}/{repo}/pages --jq '{build_type, html_url}'`.
3. Find other workflows that deploy to Pages: `grep -l deploy-pages .github/workflows/*.y*ml | grep -v replication-site.yml`.
4. If the build type is `legacy`, or the `grep` command prints a file, the project already has a site.
   - Stop. Give the person the URL of that site. Ask if the record website can replace it.
   - Do not run `gh api -X PUT repos/{owner}/{repo}/pages` before the person says yes. The PUT replaces the site.
   - After a yes for a `legacy` site, run `gh api -X PUT repos/{owner}/{repo}/pages -f build_type=workflow`.
   - After a yes for another workflow, ask the person to remove that workflow. Do not change it yourself.
   - After a no, keep the record without the website (step 8).
5. If the build type is `workflow` and the `grep` command prints nothing, Pages is ready.
6. If GitHub refuses (for example, a private repository on a free plan), stop. Give the person three choices:
   - Make the repository public.
   - Use a paid plan. GitHub Education gives Pro to teachers.
   - Keep the record without the website.
7. Do not make the choice for the person. Do not change the visibility of the repository yourself.
8. For the record without the website, delete `.github/workflows/replication-site.yml`. Keep the rest of the record.
9. Get the website URL: `gh api repos/{owner}/{repo}/pages --jq .html_url`.

## Update rules

- The skill owns these files in a project:
  - `.replication/build-site.mjs` and the `.replication/lib/` folder.
  - `.github/workflows/replication-site.yml`.
  - The block in `CLAUDE.md`, from `<!-- replication-materials:start -->` to `<!-- replication-materials:end -->`.
- The records belong to the project. `.replication/site.config.json` also belongs to the project.
- The build script and the workflow have a version line: `// replication-materials 1.2.0` and `# replication-materials 1.2.0`.
- Version 1.1.0 adds extra pages, and its workflow runs on each push to `main`.
- Version 1.2.0 adds releases, results, a timeline, a contributions page and more decision detail; all of them are optional.
- `site.config.json` has `format_version`. The build reads format version 1.
- When `format_version` is newer than the build script, the build stops. The message says "Run the update procedure of the replication-materials skill."
- Set-up never replaces a file that exists. Only the update procedure replaces skill-owned files.
- The update procedure replaces only skill-owned files. It never replaces a record.
- An update commit is not record-only. Ask the person before you push it.
