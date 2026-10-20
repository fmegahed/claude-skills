# Replication-materials skill, version 1: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| Item | Value |
|---|---|
| Status | Approved (2026-10-19) |
| Version | 1, dated 2026-10-19 |
| Written by | Claude Code (Opus 5.5), with the superpowers writing-plans skill |

**Goal:** Make the public repository `fmegahed/claude-skills` with the `replication-materials` skill, its website build, its own live record, and the `narrated-demo-video` skill moved in.

**Architecture:** The skill is a folder of instructions, templates and a Node build script. The build script reads markdown tables in `replication_materials/` and writes a static site (Home, Records, Decisions, Progress, Process, one page per document). Tables render on the server side as HTML. Document pages embed their markdown as JSON and render it in the browser. A GitHub Actions workflow builds the site and deploys it to GitHub Pages at each push that changes the record.

**Tech Stack:** Node 22 (ESM, no npm packages in the build script); `node:test`; Playwright 1.63.0 with `@axe-core/playwright` 4.13.0 (tests only); marked, DOMPurify and KaTeX from cdnjs; GitHub Actions and GitHub Pages; `gh` CLI.

**Spec:** `replication_materials/plans/2026-10-19-replication-skill-design.md` (version 3). Read it before each task. Section numbers below refer to it.

## Global Constraints

- Repository root: `C:/Users/megahefm/Dropbox/Miami/Code/claude/claude-skills`. Remote: `https://github.com/fmegahed/claude-skills` (public). Default branch `main`.
- Node 22 (local `v22.14.0`). The files under `skills/replication-materials/scripts/` import only `node:` modules.
- Dev dependencies, exact: `@playwright/test@1.63.0`, `@axe-core/playwright@4.13.0`.
- CDN pins (exact URL and SRI, `crossorigin="anonymous"`):
  - `https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js` `sha512-xeUh+KxNyTufZOje++oQHstlMQ8/rpyzPuM+gjMFYK3z5ILJGE7l2NvYL+XfliKURMpBIKKp1XoPN/qswlSMFA==`
  - `https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.4.16/purify.min.js` `sha512-flQmhkXNRQ3iUfvtdCobtpMjCb6kE+zLnTiAulAQJ3WykVfy84JvCMOo6vhwWXHTXjR25h9Zj+LyGFRWKjRoag==`
  - `https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js` `sha512-LQNxIMR5rXv7o+b1l8+N1EZMfhG7iFZ9HhnbJkTp4zjNr5Wvst75AqUeFDxeRUa7l5vEDyUiAip//r+EFLLCyA==`
  - `https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js` `sha512-iWiuBS5nt6r60fCz26Nd0Zqe0nbk1ZTIQbl3Kv7kYsX+yKMUFHzjaH2+AnM6vp2Xs+gNmaBAVWJjSmuPw76Efg==`
  - `https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css` `sha512-fHwaWebuwA7NSF5Qg/af4UeDx9XqUpYpOGgubo3yWu+b2IQR4UeQwbb42Ti7gVAjNtVoI/I9TEoYeu9omwcC6g==`
- GitHub Actions, pinned (verified 2026-10-19): `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`, `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0`, `actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0`, `actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0`, `actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1`.
- Theme: the Miami tokens of spec Section 9, light only, `color-scheme: light`. No other colours. No opacity below 100% on a colour.
- WCAG 2.2 AA: spec Section 9, "Accessibility". Reflow at 320 CSS px. Targets of at least 24 × 24 CSS px.
- All links inside the site are relative. No `href` or `src` inside the site starts with `/`. (GitHub Pages serves a project site under `/<repo>/`.)
- Versions: skill `1.0.0`; `FORMAT_VERSION = 1`. Each skill-owned file starts with the line `// replication-materials 1.0.0` (or `# replication-materials 1.0.0` in YAML).
- All markdown that this plan creates follows the 80% ASD-STE100 rule (spec Section 12).
- No key, token or authorization header in any file.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01CbjAaD4m5kdGha9nnTkFwr
  ```
- Run R, Node and git from Git Bash. Make Windows junctions with `cmd //c mklink //J`.

## Review Focus

1. **GitHub Pages subpath.** The site is served at `https://fmegahed.github.io/claude-skills/`. A root-absolute link (`/records/`) breaks there. Task 6 tests that no generated `href`/`src` starts with `/`, and Task 7 serves the site under `/repo/` in the browser test.
2. **CRLF line endings.** On Windows, records can have `\r\n`. A parser that splits on `\n` keeps `\r` in the last cell and the column check fails. Task 2 tests a CRLF table.
3. **A pipe in a cell.** Text such as `a \| b` must stay in one cell. Task 2 tests an escaped pipe.
4. **An empty record.** A new project has tables with no rows. Each page must show an empty state, not crash. Task 6 tests empty tables; Task 8 builds the bare templates.
5. **HTML in a record.** A decision or quote that contains `<script>` or a `javascript:` link must show as text. Task 5 and Task 6 test this.

---

## File structure

```
claude-skills/
  .gitattributes  .gitignore  package.json  package-lock.json  playwright.config.mjs
  README.md  CLAUDE.md
  brand/miami.json
  skills/replication-materials/
    SKILL.md
    references/record-formats.md  references/writing.md  references/site.md
    templates/  (Task 9)
    scripts/build-site.mjs        CLI: arguments, safety checks, writes files
    scripts/lib/tables.mjs        markdown tables and document metadata
    scripts/lib/decisions.mjs     people, decisions, rulings, corrections
    scripts/lib/project.mjs       config, roadmap, progress, process, documents, calls -> SiteModel
    scripts/lib/html.mjs          tokens, CSS, escaping, inline markdown, relative links, page shell
    scripts/lib/pages.mjs         the six page renderers and renderSite
    scripts/lib/client.js         browser script: filters, document rendering
  skills/narrated-demo-video/     (Task 11)
  tests/*.test.mjs  tests/a11y.spec.mjs  tests/serve.mjs  tests/fixtures/{full,bad-column}/
  replication_materials/          (Task 10)
  .replication/                   copy of scripts/ + site.config.json (Task 10)
  .github/workflows/replication-site.yml  .github/workflows/tests.yml
```

A project receives the whole `scripts/` folder as `.replication/` (so `.replication/build-site.mjs` and `.replication/lib/`).

---

### Task 1: Repository skeleton and the Miami brand file

**Files:**
- Create: `.gitattributes` (`* text=auto eol=lf`), `.gitignore` (`node_modules/`, `_site/`, `tests/.site/`, `test-results/`, `playwright-report/`, `.superpowers/`), `package.json`, `README.md` (a stub: title and one sentence), `brand/miami.json`
- Test: `tests/brand.test.mjs`

**Interfaces:**
- Produces: `brand/miami.json` = `{ "source": "https://miamioh.edu/brand/style/", "read_on": "2026-10-19", "colors": { "<key>": { "name": string, "hex": "#RRGGBB" } }, "approved_text_on": { "<background key>": ["<text key>", ...] } }`. Keys: `miami_red`, `white`, `accent_red`, `light_tan`, `medium_tan`, `dark_tan`, `black`, `medium_gray`, `warm_white`, `corn_yellow`, `slate_blue`. Hex values and pairings: spec Section 9 and the brand chart (`White: Black, Miami Red, Accent Red, Dark Tan, Slate Blue, Medium Gray`; `Miami Red: White, Warm White, Light Tan`; `Accent Red: White, Warm White, Light Tan, Corn Yellow`; `Warm White` and `Light Tan`: same as White; `Medium Tan: Black`; `Dark Tan: White, Warm White, Light Tan`; `Slate Blue: White, Warm White, Light Tan, Medium Tan, Corn Yellow`; `Medium Gray: White, Warm White, Light Tan`; `Corn Yellow: Black, Accent Red, Slate Blue`).
- Produces: `contrast(hexA: string, hexB: string): number` exported from `tests/contrast.mjs` (WCAG 2.x relative luminance), used again in Task 5.
- `package.json`: `"type": "module"`, `"private": true`, scripts `"test": "node --test \"tests/**/*.test.mjs\""`, `"test:a11y": "node skills/replication-materials/scripts/build-site.mjs --root tests/fixtures/full --out tests/.site && playwright test"`, devDependencies exact (Global Constraints).

- [ ] **Step 1: `git init -b main`, write the files above, run `npm install` (creates `package-lock.json`).**
- [ ] **Step 2: Write the failing test** `tests/brand.test.mjs`:
  - `test("palette has the 11 brand colours with exact hex")`: `miami_red.hex === "#C41230"`, `accent_red.hex === "#AD102A"`, `warm_white.hex === "#FAF9F7"`, `slate_blue.hex === "#3E5468"`, and 11 keys.
  - `test("every approved pairing meets 4.5:1")`: for each background and each text key, `contrast(...) >= 4.5`; count of pairs `=== 40`; minimum rounded to 2 decimals `=== 4.63`.
- [ ] **Step 3: Run `npm test`.** Expected: FAIL (module `tests/contrast.mjs` not found).
- [ ] **Step 4: Implement `tests/contrast.mjs`.**
- [ ] **Step 5: Run `npm test`.** Expected: 2 passing.
- [ ] **Step 6: Commit** all files, including the two plan documents already in `replication_materials/plans/`. Message: `Add repository skeleton and Miami brand palette`.

---

### Task 2: Markdown tables and document metadata

**Files:**
- Create: `skills/replication-materials/scripts/lib/tables.mjs`
- Test: `tests/tables.test.mjs`

**Interfaces:**
- Produces:
  - `class RecordFormatError extends Error` with `constructor(file: string, line: number, detail: string)`, `message = \`${file}:${line}: ${detail}\``, fields `file`, `line`.
  - `parseTables(text: string, file: string): Table[]`, `Table = { heading: string|null, line: number, columns: string[], rows: { line: number, cells: Record<string,string> }[] }`. `heading` is the text of the nearest heading above the table. Lines are 1-based. Tables inside fenced code blocks are ignored.
  - `findTable(tables: Table[], heading: string|null, columns: string[], file: string): Table`. `heading === null` takes the first table. Throws `RecordFormatError` when the table is missing (line 1) or a column is missing (line of the header row; the detail names the missing columns and the expected list).
  - `readMeta(text: string): { title: string|null, meta: Record<string,string> }`. Title: the first `# ` heading. Meta: the first table whose columns are exactly `Item`, `Value`.

- [ ] **Step 1: Write the failing tests:**
  - `parses a table under a heading` — `## Decisions` then a 2-row table: `heading === "Decisions"`, `rows[1].cells.ID === "D2"`, `rows[0].line === 5` (for the fixture text in the test).
  - `CRLF input gives the same cells` — the same text with `\r\n`: `assert.deepEqual` to the LF result.
  - `escaped pipe stays in one cell` — cell `` `a \| b` `` gives `` `a | b` ``.
  - `ignores a table inside a code fence`.
  - `row with too few cells throws with file and line` — `assert.throws(..., { message: /^d\.md:4: row has 2 cells/ })`.
  - `findTable names the missing column` — message matches `/^d\.md:3: table "Decisions" lacks column\(s\) How\./`.
  - `readMeta reads title and Item/Value table` — `meta.Status === "Draft"`.
- [ ] **Step 2: Run `node --test tests/tables.test.mjs`.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement `tables.mjs`.** Split rows on unescaped `|`; drop the leading and trailing empty cells; trim; skip the `|---|` row.
- [ ] **Step 4: Run the test.** Expected: 7 passing.
- [ ] **Step 5: Commit.** `Add markdown table parser for records`.

---

### Task 3: People, decisions, rulings and corrections

**Files:**
- Create: `skills/replication-materials/scripts/lib/decisions.mjs`
- Test: `tests/decisions.test.mjs`

**Interfaces:**
- Consumes: `parseTables`, `findTable`, `RecordFormatError` (Task 2).
- Produces:
  - Constants: `PEOPLE_COLUMNS = ["ID","Name","Role","Link"]`, `DECISION_COLUMNS = ["ID","Date","Decision","Proposed by","Decided by","How","Evidence","Source"]`, `CORRECTION_COLUMNS = ["Decision","Field","New value","Checked by","Date","Note"]`, `HOW_VALUES = ["chat","question","review","measurement","plan-approval","playback","ruling","classified"]`, `BUILT_IN_PEOPLE = { claude: "Claude Code", subagent: "Subagent", unknown: "Unknown" }`.
  - `readPeople(roadmapText: string, file: string): Map<string, { id, name, role, link }>` — the `## People` table plus the built-ins.
  - `readDecisions(text: string, file: string, people: Map): Decision[]` with `Decision = { id, date, text, proposedBy: string[], decidedBy: string[], how, evidence, source, file, line, corrected: null | { by: string, date: string, notes: string[], fields: string[] } }`. "Proposed by" and "Decided by" hold one or more person IDs separated by commas. The `## Corrections` table (optional, may be empty) is applied before return.
  - `readRulings(text: string, ledgerPath: string): Decision[]`. `ledgerPath` is relative to `replication_materials/`, for example `plans/2026-10-15-m1-execution-ledger.md`. A ruling is a line outside code fences that matches `/\bRuling(?:\s+\d+)?:\s*(.+)$/`; strip backticks at both ends of the captured text. ID: `R-<date>-<topic>-<n>` (`n` from 1 in file order); `date` and `topic` come from the file name `YYYY-MM-DD-<topic>-ledger.md`. `proposedBy = decidedBy = ["claude"]`, `how = "ruling"`, `source = "<ledgerPath>:<line>"`.
  - `applyCorrections(decisions: Decision[], table: Table, people: Map, file: string): Decision[]`. Field is one of `Decision`, `Proposed by`, `Decided by`, `How`, `Evidence`. A correction may name a `D` ID or an `R-` ID; `readDecisions` applies `D` corrections, and Task 4 applies the corrections again after it adds the rulings (so the function is idempotent: applying a row twice gives the same result).

- [ ] **Step 1: Write the failing tests:**
  - `reads two decisions and resolves people` — `decidedBy` `["fmm"]`, `how === "chat"`.
  - `unknown person ID throws` — message matches `/decisions\.md:\d+: unknown person "xyz"/`.
  - `bad How value throws` — message names the allowed values.
  - `duplicate decision ID throws`.
  - `rulings in all seven line forms` — a ledger text with the lines `Ruling: a`, `- Ruling: b`, `Ruling 3: c`, `- Ruling 4: d`, `` - `Ruling: e` ``, `Task 4: Ruling: f`, `Final: Ruling: g` gives 7 rulings; texts `["a","b","c","d","e","f","g"]`; `rulings[0].id === "R-2026-10-15-m1-execution-1"`.
  - `ruling inside a code fence is ignored`.
  - `ledger file name without a date throws`.
  - `correction replaces one field and records who checked it` — `corrected.by === "Fadel M. Megahed"`, `fields` `["Decided by"]`, original `evidence` unchanged.
  - `correction of an unknown decision throws`.
- [ ] **Step 2: Run `node --test tests/decisions.test.mjs`.** Expected: FAIL.
- [ ] **Step 3: Implement `decisions.mjs`.**
- [ ] **Step 4: Run the test.** Expected: 9 passing.
- [ ] **Step 5: Commit.** `Add decisions, rulings and corrections model`.

---

### Task 4: Project model

**Files:**
- Create: `skills/replication-materials/scripts/lib/project.mjs`
- Create: `tests/fixtures/full/` (see Step 1) and `tests/fixtures/bad-column/` (a copy of `full` whose `decisions.md` has no `How` column)
- Test: `tests/project.test.mjs`

**Interfaces:**
- Consumes: Tasks 2 and 3.
- Produces:
  - Constants: `FORMAT_VERSION = 1`; `MILESTONE_COLUMNS = ["ID","Milestone","State","Plan","Ledger"]`; `STATES = ["done","now","next","planned","blocked"]`; `OPEN_ITEM_COLUMNS = ["ID","Item","Blocks","Owner"]`; `PROCESS_COLUMNS = ["Time (UTC)","Stage","Who","What happened","Records","Session"]`; `STAGES = ["inputs","brainstorm","spec-review","plan","build","evaluate","paper"]`; `BUDGET_COLUMNS = ["Date","Service","Purpose","Max calls","Max cost (USD)","Approved by"]`; `CALL_CSV_COLUMNS = ["time_utc","call_id","purpose","model","request_id","status","latency_ms","input_tokens","output_tokens","cost_usd"]`; `DOC_KINDS = ["design","plan","ledger","investigation","review","findings"]`.
  - `parseCsv(text: string): Record<string,string>[]` (RFC 4180 quotes; CRLF or LF).
  - `loadProject(root: string, opts?: { gitSha?: string, buildDate?: string }): SiteModel`:
    ```
    SiteModel = {
      config: { project, repository, format_version, theme },        // .replication/site.config.json
      people: Map, milestones: [{ id, title, state, plan, ledger, tasksDone, tasksTotal }],
      openItems: [{ id, item, blocks, owner }], status: { current: milestone|null, next: milestone|null },
      decisions: Decision[],          // D rows by number, then rulings by ledger date; corrections applied
      events: [{ time, stage, who, what, records, session }],          // sorted by time
      documents: [{ path, title, kind, date, status, text }],          // path relative to replication_materials/
      calls: { budgets: [...], services: [{ service, calls, costUsd, maxCalls, maxCostUsd }] },
      counts: { byDecider: [{ id, name, count }] },                   // from decidedBy, all decisions
      build: { sha, date }
    }
    ```
  - Rules: after `readDecisions` and `readRulings` for each ledger in `plans/*-ledger.md`, call `applyCorrections` on the full list with the `## Corrections` table, so a correction of an `R-` ID also applies. `tasksTotal` = count of `/^### Task \d+/gm` in the plan file; `tasksDone` = count of distinct `n` in `/^Task (\d+): complete\b/gm` in the ledger; both `null` when the column is `-`. A Plan or Ledger path that does not exist throws `RecordFormatError`. `Time (UTC)` matches `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/`. Documents: `README.md`, `plans/*.md`, `findings/*.md`, `probes/**/README.md`, `calls/README.md`; kind from the file-name suffix (`probes`, `calls`, `readme` for the others); date from a `YYYY-MM-DD` prefix of the file or of the probe folder, else `null`; sorted by date (null last), then path. Service of a call file = file name without `-calls.csv`. `build.sha` = `opts.gitSha` ?? `git rev-parse --short HEAD` in `root` ?? `"local"`; `build.date` = `opts.buildDate` ?? today in UTC (`YYYY-MM-DD`).
  - Errors: missing `site.config.json` → `RecordFormatError(".replication/site.config.json", 1, "file not found")`. `format_version > FORMAT_VERSION` → `Error` whose message contains `Run the update procedure of the replication-materials skill.`

- [ ] **Step 1: Make `tests/fixtures/full/`.** It has: `.replication/site.config.json` (`{"project":"Fixture project","repository":"https://github.com/example/fixture","format_version":1}`); `replication_materials/README.md`; `project/roadmap.md` (people `fmm` and `aav`; milestones `M1 done`, `M2 now` with plan and ledger, `M3 next`; one open item); `project/decisions.md` (D1 proposed and decided by `fmm`, How `chat`; D2 proposed and decided by `claude`, How `measurement`, text `Use <script>alert(1)</script> \| safely`; D3 proposed and decided by `aav`, How `review`; one correction: D3 `Decided by` → `fmm`, checked by `fmm`); `project/process.md` (3 events, one out of time order); `plans/2026-10-01-alpha-design.md` (Item/Value table, `$\hat{p}$` math, a 12-column table); `plans/2026-10-02-alpha-plan.md` (`### Task 1` to `### Task 3`); `plans/2026-10-05-alpha-ledger.md` (`Task 1: complete`, `Task 2: complete`, `Task 2: complete` again, `Ruling: keep CSV`, `- Ruling 2: pin marked`); `findings/2026-10-04-alpha-findings.md`; `probes/2026-10-03-speed/README.md`; `calls/README.md` (one budget row for `jev`, max 40 calls, USD 0.01); `calls/jev-calls.csv` (2 rows, `cost_usd` 0.001 and 0.002).
- [ ] **Step 2: Write the failing tests** (`loadProject("tests/fixtures/full", { gitSha: "abc1234", buildDate: "2026-10-19" })`):
  - `status is the now and next milestones` — `status.current.id === "M2"`, `status.next.id === "M3"`.
  - `task counts from plan and ledger` — M2: `tasksDone === 2`, `tasksTotal === 3`.
  - `decisions include rulings after D rows` — ids `["D1","D2","D3","R-2026-10-05-alpha-1","R-2026-10-05-alpha-2"]`; D3 `decidedBy` `["fmm"]` with `corrected` set.
  - `counts by decider` — `fmm` 2, `claude` 3.
  - `events sorted by time`.
  - `documents in date order with kinds` — kinds in order `["design","plan","probes","findings","ledger","readme","calls"]` (dated first, then undated by path).
  - `calls summary` — `jev`: `calls === 2`, `costUsd` rounded to 3 decimals `=== 0.003`, `maxCalls === 40`.
  - `missing column gives file and line` — `loadProject("tests/fixtures/bad-column")` throws `/project\/decisions\.md:\d+: table "Decisions" lacks column\(s\) How/`.
  - `newer format_version asks for the update procedure` — copy `full` to a temp folder, set `format_version: 2`, expect a throw that matches `/Run the update procedure/`.
  - `missing plan file throws`.
- [ ] **Step 3: Run `node --test tests/project.test.mjs`.** Expected: FAIL.
- [ ] **Step 4: Implement `project.mjs`.**
- [ ] **Step 5: Run the test.** Expected: 10 passing. Run `npm test`. Expected: all passing.
- [ ] **Step 6: Commit.** `Add project model for the records site`.

---

### Task 5: Theme, escaping and the page shell

**Files:**
- Create: `skills/replication-materials/scripts/lib/html.mjs`
- Test: `tests/html.test.mjs`

**Interfaces:**
- Consumes: `SiteModel` (Task 4).
- Produces:
  - `VERSION = "1.0.0"`.
  - `DEFAULT_TOKENS = { bg: "#FAF9F7", surface: "#FFFFFF", tan: "#EDECE2", ink: "#000000", muted: "#666666", rule: "#CCC9B8", accent: "#C41230", "accent-strong": "#AD102A", "on-accent": "#FFFFFF" }`.
  - `CDN`: an object with the five pinned files of Global Constraints, each `{ src, integrity }`.
  - `escapeHtml(s: string): string` — escapes `& < > " '`.
  - `inline(s: string): string` — escapes, then turns `` `code` `` into `<code>`, and `[text](url)` into a link only when `url` starts with `https://` or `http://`. Any other link stays as escaped text.
  - `rel(from: string, to: string): string` — both are site paths such as `decisions/index.html`; the result never starts with `/`.
  - `themeCss(tokens: object): string` — the full stylesheet. It includes: `:root { color-scheme: light; --bg: ...; }`; a 3 px `--accent` focus ring with offset; `min-height: 24px; min-width: 24px` on nav links and buttons; a 16 px side gutter; `scroll-padding-top`; the header is sticky only at `min-width: 900px`; `.table-wrap { overflow-x: auto }`; smooth scroll only in `@media (prefers-reduced-motion: no-preference)`.
  - `pageShell({ path, title, body, model, scripts }): string` — a full document: `<!doctype html>`, `<html lang="en">`, charset, viewport, `<meta name="generator" content="replication-materials 1.0.0">`, `<title>{title} · {project}</title>`, the stylesheet with `model.config.theme` merged over `DEFAULT_TOKENS`, a skip link to `#main`, a header with the project name on a `--accent` band (`--on-accent` text), a nav (Home, Records, Decisions, Progress, Process, Repository) with `aria-current="page"` on the current page, `<main id="main">`, and a footer `Built from commit {sha} on {date}.` with a link to the repository.

- [ ] **Step 1: Write the failing tests:**
  - `default tokens agree with brand/miami.json` — each token value equals the brand hex of its colour.
  - `default text pairings meet 4.5:1` — `ink`, `muted`, `accent`, `accent-strong` on `bg`, `surface` and `tan`, and `on-accent` on `accent` and `accent-strong`: each `contrast(...) >= 4.5` (use `tests/contrast.mjs`).
  - `escapeHtml escapes script` — `escapeHtml("<script>")` gives `"&lt;script&gt;"`.
  - `inline keeps javascript: links as text` — output has no `<a`; it contains `javascript:`.
  - `inline makes https links and code` — `<a href="https://x.org">x</a>` and `<code>a</code>`.
  - `rel gives relative paths` — `rel("index.html","decisions/index.html") === "decisions/index.html"`; `rel("docs/plans/a/index.html","index.html") === "../../../index.html"`.
  - `pageShell is a full accessible document` — starts with `<!doctype html>`; contains `lang="en"`, `name="viewport"`, `href="#main"`, `aria-current="page"`, `Built from commit abc1234 on 2026-10-19.`; no `href="/` and no `src="/`.
  - `theme override from config` — `theme: { accent: "#3E5468" }` puts `--accent: #3E5468` in the CSS.
- [ ] **Step 2: Run `node --test tests/html.test.mjs`.** Expected: FAIL.
- [ ] **Step 3: Implement `html.mjs`.**
- [ ] **Step 4: Run the test.** Expected: 8 passing.
- [ ] **Step 5: Commit.** `Add Miami theme and accessible page shell`.

---

### Task 6: Pages and the build command

**Files:**
- Create: `skills/replication-materials/scripts/lib/pages.mjs`, `skills/replication-materials/scripts/lib/client.js`, `skills/replication-materials/scripts/build-site.mjs`
- Test: `tests/pages.test.mjs`, `tests/build.test.mjs`

**Interfaces:**
- Consumes: Tasks 4 and 5.
- Produces:
  - `renderSite(model: SiteModel): Map<string, string>` — site path → HTML. Paths: `index.html`, `records/index.html`, `decisions/index.html`, `progress/index.html`, `process/index.html`, and `docs/<document path without .md>/index.html` for each document.
  - `renderHome`, `renderRecords`, `renderDecisions`, `renderProgress`, `renderProcess` (each `(model) => string`), `renderDocument(model, doc) => string`. Content: spec Section 9 "Pages".
  - Markup rules (all pages): each table is in `<div class="table-wrap" tabindex="0" role="region" aria-label="{caption}">` with `<caption>` and `<th scope="col">`. Filters (Records: kind; Decisions: decided by, how) are `<button type="button" data-filter-key="k" data-filter-value="v" aria-pressed="false">` in a `<div data-filters hidden>`; rows have `data-row` and `data-<key>` attributes; the count is `<p data-filter-count aria-live="polite">`. Milestone states show the state as text. Empty tables show a sentence such as `No decisions yet.`
  - Document pages: the markdown is in `<script type="application/json" id="doc-md">` with `<` written as `\u003c`. The escaped text is also in `<pre id="doc-fallback">`. The page loads the five CDN files with `integrity` and `crossorigin="anonymous"`.
  - `client.js` (inlined into each page by `pages.mjs`): filters (toggle `aria-pressed`, hide rows, update the count text `Showing {n} of {m}.`); on document pages, `DOMPurify.sanitize(marked.parse(md))` into the content, KaTeX auto-render with `$...$` and `$$...$$`, each table wrapped in a focusable `.table-wrap`, and link rewriting: a relative link to a `.md` file of the record goes to its `docs/.../index.html` page; any other relative link goes to `{repository}/blob/main/replication_materials/{path}`. When a CDN file does not load, the fallback text stays.
  - `build-site.mjs`: first line `// replication-materials 1.0.0`. `main(argv: string[]): Promise<number>`; arguments `--root <dir>` (default `.`) and `--out <dir>` (default `_site`). `GIT_SHA` from the environment, when set, wins over `git rev-parse`. Out-folder check before any write: the folder must not exist, or be empty, or hold a previous site (its `index.html` has the generator meta). Otherwise exit 1 with `replication-materials: <out> is not empty and is not a previous site.` On `RecordFormatError` or a config error, print `replication-materials: <message>` to stderr and exit 1. On success print `Wrote <n> pages to <out>.` and exit 0.

- [ ] **Step 1: Write the failing tests** in `tests/pages.test.mjs` (model from `loadProject` on `tests/fixtures/full`):
  - `renderSite makes the six kinds of page` — has `index.html`, `records/index.html`, `decisions/index.html`, `progress/index.html`, `process/index.html`, `docs/plans/2026-10-01-alpha-design/index.html`.
  - `no root-absolute links in any page` — for each page, no match of `/(href|src)="\//`.
  - `script text in a decision is escaped` — `decisions/index.html` contains `&lt;script&gt;alert(1)&lt;/script&gt;` and does not contain `<script>alert(1)`.
  - `escaped pipe shows as a pipe` — `decisions/index.html` contains `| safely`.
  - `decisions page has filters for decider and how` — `data-filter-key="decided"` buttons for `fmm` and `claude`; `data-filter-key="how"` button for `ruling`.
  - `corrected decision says who checked it` — contains `Corrected by`.
  - `document page embeds markdown safely` — the JSON script contains `\u003c` where the markdown has `<`; contains `integrity="sha512-xeUh`.
  - `progress shows tasks and calls` — contains `2 of 3` and `jev` and `0.003`.
  - `empty record shows empty states` — model with empty decisions, events and documents: `decisions/index.html` contains `No decisions yet.`
- [ ] **Step 2: Write the failing tests** in `tests/build.test.mjs` (run `build-site.mjs` with `node:child_process` `spawnSync`, out folder in `os.tmpdir()`):
  - `builds the fixture and reports pages` — exit 0; stdout matches `/^Wrote \d+ pages to /`; `index.html` exists.
  - `bad column exits 1 with file and line` — exit 1; stderr matches `/replication-materials: project\/decisions\.md:\d+: table "Decisions" lacks column\(s\) How/`.
  - `refuses a non-empty folder that is not a site` — out folder with `keep.txt`: exit 1; `keep.txt` still exists.
  - `rebuild over a previous site works` — build twice into the same folder: both exit 0.
- [ ] **Step 3: Run `npm test`.** Expected: the new tests FAIL.
- [ ] **Step 4: Implement `pages.mjs`, `client.js` and `build-site.mjs`.**
- [ ] **Step 5: Run `npm test`.** Expected: all passing.
- [ ] **Step 6: Build the fixture and look at it:** `node skills/replication-materials/scripts/build-site.mjs --root tests/fixtures/full --out tests/.site`, then open `tests/.site/index.html` and one document page in Playwright at 320 px and 1280 px. Expected: Miami red header band, readable tables, math rendered, no horizontal page scroll at 320 px.
- [ ] **Step 7: Commit.** `Add site pages and build command`.

---

### Task 7: Accessibility check in the browser

**Files:**
- Create: `playwright.config.mjs`, `tests/serve.mjs`, `tests/a11y.spec.mjs`

**Interfaces:**
- Consumes: the built fixture in `tests/.site/` (the `test:a11y` script builds it).
- Produces: `tests/serve.mjs` — `node tests/serve.mjs <dir> <port>` serves `<dir>` under the URL prefix `/repo/` (to copy the GitHub Pages subpath) and returns 404 outside it. `playwright.config.mjs`: `testMatch: "a11y.spec.mjs"`, Chromium only, `webServer: { command: "node tests/serve.mjs tests/.site 4173", url: "http://127.0.0.1:4173/repo/index.html" }`.

- [ ] **Step 1: Write the failing tests** in `tests/a11y.spec.mjs`. For each page path of the fixture site (index, records, decisions, progress, process, the design document page) and for each width (320 and 1280):
  - `axe finds no WCAG 2.2 AA violation` — `new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze()` gives `violations` `[]`.
  - `no horizontal scroll of the page at 320 px` — `document.documentElement.scrollWidth <= 320`.
  - `every link resolves under /repo/` — each internal `a[href]` gives HTTP 200 from the test server.
  Plus, at 1280 px only:
  - `filters work with the keyboard` — on the decisions page, Tab to the first filter button, press Enter: `aria-pressed="true"` and the count text changes.
  - `focus ring is visible and not covered` — Tab through the first 15 focusable elements; for each, the computed `outline-style` is not `none` and `document.elementFromPoint` at its centre is the element or inside it.
- [ ] **Step 2: Run `npm run test:a11y`** (first `npx playwright install chromium`). Expected: FAIL where the pages need fixes, or PASS when Task 6 already meets them. Record which.
- [ ] **Step 3: Fix the pages or the CSS in `pages.mjs`, `client.js` or `html.mjs` until all pass.** Do not change the tests to pass. Do not disable an axe rule.
- [ ] **Step 4: Run `npm run test:a11y` and `npm test`.** Expected: all passing.
- [ ] **Step 5: Commit.** `Add WCAG 2.2 AA browser checks`.

---

### Task 8: Templates

**Files:**
- Create in `skills/replication-materials/templates/`: `replication_materials/README.md`, `replication_materials/project/roadmap.md`, `replication_materials/project/decisions.md`, `replication_materials/project/process.md`, `replication_materials/calls/README.md`, `.replication/site.config.json`, `.github/workflows/replication-site.yml`, `CLAUDE-block.md`, `ledger-header.md`, `probe-README.md`
- Test: `tests/templates.test.mjs`

**Interfaces:**
- Consumes: `build-site.mjs` (Task 6); `SKILL.md` names these paths (Task 9).
- Produces: placeholders `{{PROJECT}}`, `{{REPOSITORY}}`, `{{OWNER_ID}}`, `{{OWNER_NAME}}`, `{{DATE}}`. `CLAUDE-block.md` sits between the lines `<!-- replication-materials:start -->` and `<!-- replication-materials:end -->`, so that the update procedure can replace it; its text is spec Section 11 "The CLAUDE.md block", including D15. The workflow is the test workflow of the spike (`replication-site-spike/.github/workflows/site.yml`) without the `artifact` job, with first line `# replication-materials 1.0.0`, the name `Replication site`, the build command `node .replication/build-site.mjs --out _site`, and the paths `replication_materials/**`, `.replication/**`, `.github/workflows/replication-site.yml`.

- [ ] **Step 1: Write the failing tests:**
  - `templates build to a site` — copy the templates and `scripts/` (as `.replication/`) to a temp folder; replace the placeholders; run `build-site.mjs --root <temp>`; exit 0. The decisions template has exactly one row, D1 (the set-up decision, proposed by `claude`, decided by `{{OWNER_ID}}`, How `chat`), so `decisions/index.html` contains `D1`. The process template has one set-up row, so `process/index.html` contains `inputs`. `records/index.html` contains `No documents yet.`
  - `workflow pins every action to a SHA` — each `uses:` line matches `/@[0-9a-f]{40} # v\d/`.
  - `workflow gives each job only its permissions` — top level `permissions: {}`; the deploy job has `pages: write` and `id-token: write`.
  - `CLAUDE block has both markers and the D15 rule`.
  - `templates contain no key-like text` — no match of `/(sk-|ghp_|gho_|api[_-]?key\s*=)/i`.
- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Write the templates.** Tables have the exact columns of Tasks 3 and 4.
- [ ] **Step 4: Run `npm test`.** Expected: all passing.
- [ ] **Step 5: Commit.** `Add record and workflow templates`.

---

### Task 9: Skill text and references

**Files:**
- Create: `skills/replication-materials/SKILL.md`, `skills/replication-materials/references/record-formats.md`, `skills/replication-materials/references/writing.md`, `skills/replication-materials/references/site.md`

**REQUIRED SUB-SKILL:** superpowers:writing-skills. Follow its test-first method for skills: baseline scenarios without the skill, then write the skill, then the same scenarios with the skill.

**Interfaces:**
- Consumes: the column constants of Tasks 3 and 4 (the references must list the same columns and values), the templates of Task 8 (by path).
- Produces: `SKILL.md` with front matter `name: replication-materials` and a `description` that starts with `Use when` and names: starting a research project, setting up replication materials, recording a decision, closing a milestone, correcting a record, updating the skill files. The body has the five procedures of spec Section 11 (set-up, during the work, end of milestone, correction, update) as numbered lists. Set-up includes the rules of spec Section 10 "Existing projects" (ask before `git mv` of `docs/superpowers/` files; no transcript back-fill unless asked) and D14 (`^replication_materials$` and `^\.replication$` in `.Rbuildignore` when a `DESCRIPTION` file exists). Set-up step 6 treats HTTP 409 from the Pages API (Pages already on) as success when `build_type` is `workflow`, and else sets it with `gh api -X PUT repos/{owner}/{repo}/pages -f build_type=workflow`.

- [ ] **Step 1: Baseline (RED).** Run four scenarios, each with a fresh subagent and without the skill, in scratch folders with no GitHub access:
  1. "Set up replication records for this project." The folder has a git repository and no remote.
  2. "We decided to use logistic calibration; I chose it over isotonic." (A project folder that has a `replication_materials/` record from the Task 8 templates.)
  3. "Milestone M1 is finished." (A record with an SDD ledger in `.superpowers/sdd/m1/progress.md`.)
  4. "Run the 500 JEV calls for the sample-size study now."
  Write down what each subagent does wrong (for example: it creates files without asking for a remote; it does not record who decided; it makes paid calls without a budget row).
- [ ] **Step 2: Write `SKILL.md` and the three references (GREEN)** so that each failure has a direct instruction. `writing.md` holds spec Section 12. `record-formats.md` holds spec Section 10. `site.md` holds spec Sections 9 and 13 and the update rules.
- [ ] **Step 3: Run the four scenarios again with the skill.** Expected: (1) stops and asks for a GitHub remote with Actions; (2) adds one row to `decisions.md` with `Proposed by` and `Decided by` from `roadmap.md` IDs, `How` `chat`, a quote of at most 25 words, and the session ID; (3) copies the ledger with the header and sets M1 `done` and the next milestone `now`; (4) refuses until a budget row exists in `calls/README.md`.
- [ ] **Step 4: Close the gaps (REFACTOR)** and run the failing scenarios again until all four pass.
- [ ] **Step 5: Check the writing.** Each procedure sentence has at most 20 words; no contractions; active voice. Fix outliers that are not technical terms.
- [ ] **Step 6: Commit.** `Add replication-materials SKILL.md and references`.

---

### Task 10: The record of this repository and its workflows

**Files:**
- Create: `replication_materials/README.md`, `replication_materials/project/roadmap.md`, `replication_materials/project/decisions.md`, `replication_materials/project/process.md`, `replication_materials/calls/README.md`, `replication_materials/probes/2026-10-19-site-spike/README.md`, `replication_materials/probes/2026-10-19-miami-contrast/README.md` with `contrast.mjs` and `output.txt`, `.replication/` (a copy of `skills/replication-materials/scripts/` and `site.config.json`), `.github/workflows/replication-site.yml` (from the template), `.github/workflows/tests.yml`, `CLAUDE.md` (the block from the template)
- Test: `tests/repo-record.test.mjs`

**Interfaces:**
- Consumes: templates (Task 8), build (Task 6).
- Produces: the live record. Content:
  - `roadmap.md`: person `fmm` = Fadel M. Megahed, Owner, `https://miamioh.edu/fsb/directory/?up=/directory/megahefm`. Milestones: `M1 | Replication-materials skill, version 1 | now | plans/2026-10-19-replication-skill-plan.md | -`; `M2 | narrated-demo-video for a wider audience | planned | - | -`. Open items O1 to O6 from spec Section 15.
  - `decisions.md`: D1 to D21 from spec Section 7, in the full format: Date `2026-10-19`; names become `fmm` or `claude`; D8 and D15 proposed by `claude`; How as in the spec; Evidence as in the spec; Source `session b36ad167`.
  - `process.md`: one row for each event below. Times are UTC. Get the exact times of the two multiple-choice answers (D15, D20) and of the builder check from the transcript `~/.claude/projects/C--Users-megahefm-Dropbox-Miami-Code-claude-fine-tuned-jev/b36ad167-66f5-45af-9d6c-bf3f817c6f58.jsonl` (`timestamp` of the matching `tool_result`). Known times: `2026-10-20T01:19Z` inputs, fmm, initial request; `01:19` brainstorm, Claude Code (Opus 5.5), brainstorming skill and reading of the EXPERTA record; `01:23` fmm, purpose of the skill; `01:24` fmm, lighter and ASD-STE100; `01:27` fmm, one living site by CI; `01:28` fmm, EXPERTA artifact as the model; `01:30` fmm, Pages is acceptable; `01:31` fmm, throwaway public repository; spike commits `7e7b56d` and `de4b394` (times from `gh api repos/fmegahed/replication-site-spike/commits`); `01:37` fmm, a public site is acceptable; `01:45` fmm, playback approved, design written; builder check by a subagent (Opus 5.5); D15 answer; `02:03` fmm, design approved; `02:05` fmm, one repository, Miami theme; `02:07` fmm, WCAG 2.2; D20 answer; plan written. Session column: `b36ad167`.
  - `probes/2026-10-19-site-spike/README.md`: what the spike measured (spec Section 8, rows 4 to 6) and a link to `https://github.com/fmegahed/replication-site-spike`.
  - `probes/2026-10-19-miami-contrast/`: copy `contrast.mjs` from `C:/Users/megahefm/AppData/Local/Temp/claude/C--Users-megahefm-Dropbox-Miami-Code-claude-fine-tuned-jev/b36ad167-66f5-45af-9d6c-bf3f817c6f58/scratchpad/miami-brand/contrast.mjs`; `output.txt` is its output.
  - `calls/README.md`: the budget table with no rows. This repository makes no paid API calls.
  - `.replication/site.config.json`: `{"project":"claude-skills","repository":"https://github.com/fmegahed/claude-skills","format_version":1}`.
  - `tests.yml`: on push and pull request; `permissions: contents: read`; pinned checkout and setup-node; `npm ci`; `npm test`; `npx playwright install --with-deps chromium`; `npm run test:a11y`.

- [ ] **Step 1: Write the failing test** `tests/repo-record.test.mjs`:
  - `the repository record builds` — `loadProject(".")` does not throw; `decisions.length >= 21`; ids include `D1` and `D21`.
  - `the repository copy of the build script equals the skill copy` — each file in `.replication/` (except `site.config.json`) is byte-equal to the file of the same name in `skills/replication-materials/scripts/`.
- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Write the record files, copy the scripts, write the workflows and `CLAUDE.md`.**
- [ ] **Step 4: Run `npm test` and `node .replication/build-site.mjs --out _site`.** Expected: all passing; the build prints `Wrote <n> pages to _site.`
- [ ] **Step 5: Commit.** `Add the record of this repository and its workflows`.

---

### Task 11: Move narrated-demo-video in and install the skills

**Files:**
- Move: `C:/Users/megahefm/.claude/skills/narrated-demo-video/` → `skills/narrated-demo-video/` (no change to any file)
- Modify: `.gitignore` (add `skills/narrated-demo-video/assets/brand/*.webp`), `README.md` (the skills and how to install each one)

- [ ] **Step 1: Record the SHA-256 of each of the 15 files** of the video skill (`sha256sum`), to compare after the move.
- [ ] **Step 2: Copy the folder** into `skills/narrated-demo-video/`, check the 15 SHA-256 values, then remove the original folder.
- [ ] **Step 3: Make the junctions:**
  `cmd //c mklink //J "C:\Users\megahefm\.claude\skills\narrated-demo-video" "C:\Users\megahefm\Dropbox\Miami\Code\claude\claude-skills\skills\narrated-demo-video"` and the same for `replication-materials`.
- [ ] **Step 4: Verify.** `test -f ~/.claude/skills/narrated-demo-video/SKILL.md && test -f ~/.claude/skills/replication-materials/SKILL.md` exits 0. `git status --porcelain` lists no `.webp` file.
- [ ] **Step 5: Write `README.md`:** one section for each skill (what it does, the install command with a junction on Windows and `ln -s` elsewhere), the link to the records site, and the licence note for the Source Serif 4 fonts (their `LICENSE.md`).
- [ ] **Step 6: Commit.** `Move narrated-demo-video into the repository`.

---

### Task 12: Publish the repository and its site

- [ ] **Step 1: Create the repository and Pages:**
  `gh repo create fmegahed/claude-skills --public --description "Claude Code skills of Fadel M. Megahed, with a live record of how they were made"`, then `gh api -X POST repos/fmegahed/claude-skills/pages -f build_type=workflow`.
- [ ] **Step 2: Push.** `git remote add origin https://github.com/fmegahed/claude-skills.git && git push -u origin main`.
- [ ] **Step 3: Watch both workflow runs** with `gh run watch <id> --exit-status`. Expected: `Replication site` and `Tests` both `success`. If `Tests` fails, fix the cause in a new commit; do not skip a check.
- [ ] **Step 4: Verify the live site.** `curl -s https://fmegahed.github.io/claude-skills/decisions/index.html` contains `D21`. `curl -s https://fmegahed.github.io/claude-skills/docs/plans/2026-10-19-replication-skill-design/index.html` returns 200. Take screenshots at 320 px and 1280 px of the Home and Decisions pages and look at them.
- [ ] **Step 5: Add a process row** (stage `build`, "Repository published") to `process.md` and push it to `main` (D15).

---

### Task 13: Acceptance in a new project and close of the milestone

- [ ] **Step 1: Prepare the test project.** In the scratchpad, make `setup-test/` with `git init -b main` and one file `README.md` (`# Setup test`). Do not add a remote.
- [ ] **Step 2: Run set-up without a remote.** A fresh subagent, with the skill installed, gets "Set up replication materials for this project" in `setup-test/`. Expected: it stops and asks for a GitHub remote with Actions. It creates no file.
- [ ] **Step 3: Add the remote and run set-up again.** `git remote add origin https://github.com/fmegahed/replication-site-spike.git`. The subagent runs set-up. The first push replaces the spike history: `git push --force -u origin main` (allowed for this throwaway repository by spec Section 14). Expected: the Pages API gives 409 and set-up continues (Pages is already on with `build_type` `workflow`); the workflow run passes; `https://fmegahed.github.io/replication-site-spike/` shows the project name `setup-test` and decision D1 (the set-up decision).
- [ ] **Step 4: Living-document check.** Add a decision row D2 in `setup-test`, commit, push. Expected: within the run time, `https://fmegahed.github.io/replication-site-spike/decisions/index.html` contains `D2`.
- [ ] **Step 5: Close milestone M1 in this repository** with the end-of-milestone procedure of the skill: copy the working ledger from `.superpowers/sdd/<plan>/progress.md` to `replication_materials/plans/2026-10-19-replication-skill-ledger.md` with the header from `ledger-header.md`; set M1 to `done` in `roadmap.md`; add process rows for the acceptance tests; push to `main`; check that the `Replication site` run passes and that the Progress page shows M1 as done with its task count.
- [ ] **Step 6: Report** the site URL, the test results and the open items O1 to O6 to Fadel.
