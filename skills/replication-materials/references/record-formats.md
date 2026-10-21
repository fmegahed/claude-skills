# Record formats

This file gives each table, column and value of the record. The build script checks these formats. When a record does not agree, the build stops with `replication-materials: <file>:<line>: <detail>`.

Paths in this file are relative to `replication_materials/`, except paths that start with `.replication/`, `.github/` or `.superpowers/`.

## Folder

```
replication_materials/
  README.md          lead paragraph, people, what each folder holds, how to run again
  plans/             YYYY-MM-DD-<topic>-<kind>.md
  probes/YYYY-MM-DD-<topic>/  scripts and README.md (file | what it measures)
  findings/          YYYY-MM-DD-<topic>-findings.md, script, output
  calls/             README.md (budgets) and <service>-calls.csv
  project/
    roadmap.md       people, milestones, open items
    decisions.md     decisions, topics, corrections and checks
    process.md       events
    releases.md      optional: one row for each tag
    results.md       optional: the headline results
    contributions.md optional: the account of the researchers
  environment/       session information, lock files, versions
.replication/
  build-site.mjs     the build script (a copy from the skill), with lib/
  site.config.json   project name, repository URL, format_version, theme, pages
.github/workflows/replication-site.yml
```

## Allowed values

Use these values exactly. The build stops on any other value.

| Column | File | Values |
|---|---|---|
| How | `project/decisions.md` | `chat`, `question`, `review`, `measurement`, `plan-approval`, `playback`, `ruling`, `classified` |
| Stage | `project/process.md` | `inputs`, `brainstorm`, `spec-review`, `plan`, `build`, `evaluate`, `paper` |
| State | `project/roadmap.md` | `done`, `now`, `next`, `planned`, `blocked` |
| Proposed by, Decided by, Checked by | `project/decisions.md` | an ID from `## People` in `roadmap.md`, or `claude`, `subagent`, `unknown` |
| Field (corrections) | `project/decisions.md` | `Decision`, `Proposed by`, `Decided by`, `How`, `Evidence` |
| Document kind | `plans/`, `findings/` | `design`, `plan`, `ledger`, `investigation`, `review`, `findings` |

The built-in person IDs show on the website as Claude Code (`claude`), Subagent (`subagent`) and Unknown (`unknown`).

## Tables and columns

Keep each header and its column order exactly.

| File | Heading above the table | Columns |
|---|---|---|
| `project/roadmap.md` | `## People` | `ID`, `Name`, `Role`, `Link` |
| `project/roadmap.md` | `## Milestones` | `ID`, `Milestone`, `State`, `Plan`, `Ledger` |
| `project/roadmap.md` | `## Open items` | `ID`, `Item`, `Blocks`, `Owner` |
| `project/decisions.md` | `## Decisions` | `ID`, `Date`, `Decision`, `Proposed by`, `Decided by`, `How`, `Evidence`, `Source` |
| `project/decisions.md` | `## Topics` | `Topic`, `Meaning` |
| `project/decisions.md` | `## Corrections` | `Decision`, `Field`, `New value`, `Checked by`, `Date`, `Note` |
| `project/decisions.md` | `## Checks` | `Decision`, `Checked by`, `Date`, `Note` |
| `project/releases.md` | `## Releases` | `Tag`, `Date`, `Commit`, `Summary`, `Decisions`, `Results` |
| `project/results.md` | `## Results` | `ID`, `Release`, `Result`, `Value`, `Source`, `Decisions`, `Replaces` |
| `project/process.md` | (the first table) | `Time (UTC)`, `Stage`, `Who`, `What happened`, `Records`, `Session` |
| `calls/README.md` | (the first table) | `Date`, `Service`, `Purpose`, `Max calls`, `Max cost (USD)`, `Approved by` |
| `calls/<service>-calls.csv` | (the first line) | `time_utc,call_id,purpose,model,request_id,status,latency_ms,input_tokens,output_tokens,cost_usd` |

The `## Decisions` table can have four more columns after `Source`: `Time (UTC)`, `Topic`, `Impact` and `Replaces`. They are optional and the build reads them by name. A project can add them to an existing table. The new tables and files are optional too. A record of version 1.1.0 builds with no change.

Rules for all tables:

- Each row has the same number of cells as the header.
- Write a `|` in a cell as `\|`.
- Write a date as `YYYY-MM-DD`. Get it with `date -u +%F`.
- The build does not read a table in a code fence.

## Documents

- Name each document `plans/YYYY-MM-DD-<topic>-<kind>.md` or `findings/YYYY-MM-DD-<topic>-findings.md`.
- A superpowers spec is a `design`. A superpowers plan is a `plan`. Both go to `plans/`, not to `docs/superpowers/`.
- Start each document with a table `| Item | Value |`. It has at least the rows Status, Version (with its date) and Written by.
- The Records page lists `README.md`, `plans/*.md`, `findings/*.md`, `probes/<topic>/README.md` and `calls/README.md`. It sorts them by the date in the name.
- Write a fill-in marker as `[...]`, not with angle brackets. The website removes `<word ...>` outside a code span.

## `project/roadmap.md`

### People

- `ID` is short, for example `fmm`. Do not use the built-in IDs `claude`, `subagent` or `unknown`. The build stops on them.
- `Link` is a URL or `-`.

### Milestones

- `ID` is `M1`, `M2`, and so on.
- `State` is one of `done`, `now`, `next`, `planned`, `blocked`. Keep at most one milestone at `now`.
- `Plan` and `Ledger` are paths relative to `replication_materials/`, or `-`. Example: `plans/2026-10-18-m1-plan.md`.
- The file of a path must exist. Else the build stops.
- The Progress page counts the tasks of a plan from its lines that start with `### Task <n>`.
- It counts the tasks done from the lines of the ledger that start with `Task <n>: complete`.
- The Home page shows the milestone at `now` as current, and the first milestone at `next` as next.

### Open items

- `ID` is `O1`, `O2`, and so on.
- `Blocks` is a milestone ID or `-`. `Owner` is a person ID.

## `project/decisions.md`

### Decisions

| Column | Format |
|---|---|
| `ID` | `D1`, `D2`, and so on, in the order of the record. Never use an ID two times. |
| `Date` | `YYYY-MM-DD`, the date of the decision. |
| `Decision` | One sentence in active voice that names the choice. |
| `Proposed by` | Person IDs, with commas between them (`fmm, claude`). |
| `Decided by` | Person IDs, with commas between them. |
| `How` | One allowed value (below). |
| `Evidence` | A quote and its date, or the name of a record line (below). |
| `Source` | The session ID, or the document and its section. |

Values of `How`:

| Value | Use it when |
|---|---|
| `chat` | the person said it in the chat. |
| `question` | the person chose an option of a multiple-choice question in Claude Code. |
| `review` | a review (by a person or a reviewer agent) decided it. |
| `measurement` | a probe or a measurement decided it. |
| `plan-approval` | the person approved a plan that holds it. |
| `playback` | the person approved a playback (a summary of the design) that holds it. |
| `ruling` | Claude Code decided it alone. The build adds the rulings of the ledgers. Do not copy those. |
| `classified` | Claude Code made the row later, from an old transcript, because the person asked. |

Who proposed and who decided:

- Write only what the session or the words of the person show. Write `unknown` for a value that they do not show.
- When the person accepts an option that Claude Code recommended, write Proposed by `claude` and Decided by the person ID.
- When Claude Code decides alone, outside a ledger, write Proposed by `claude`, Decided by `claude` and How `ruling`.

The `Evidence` cell holds one of these, and nothing else:

- The words of the decider: `"<quote of at most 25 words>" (YYYY-MM-DD)`.
- For `question`: the label of the chosen option, `"<label>" (YYYY-MM-DD)`.
- For `review`, `measurement` or `plan-approval`: the name of the record line, for example `findings/2026-10-19-noise-findings.md, Table 2`.

Do not add a comment, a reason or the name of the proposer to `Evidence`. The other columns hold those facts.

Examples of correct rows:

```
| D4 | 2026-10-19 | Tune the model with 5-fold cross-validation. | claude | fmm | question | "5 folds (Recommended)" (2026-10-19) | b36ad167-66f5-45af-9d6c-bf3f817c6f58 |
| D5 | 2026-10-20 | Drop the pilot data from the main analysis. | fmm | fmm | chat | "Leave the pilot out, it used the old form." (2026-10-20) | 0c1d9e2a-7b44-4f0e-9a51-2d6f3b8e7c10 |
```

A wrong `Evidence` cell: `"5 folds (Recommended)" (2026-10-19). Claude Code proposed the options.` The second sentence is a comment. `Proposed by` already holds that fact.

### The session ID

- In a local session, the session ID is the name of the newest transcript file, without `.jsonl`.
- The transcripts are in `~/.claude/projects/<slug>/`. `<slug>` is the project path with each character that is not a letter or a digit changed to `-`.
- Example: `C:\Users\fmm\Code\my_study` gives `C--Users-fmm-Code-my-study`.
- Command: `basename "$(ls -t ~/.claude/projects/<slug>/*.jsonl | head -1)" .jsonl`.
- In a cloud session, the session ID is the session URL.
- If you cannot find the session ID, write `unknown`.

### Optional columns

| Column | Format |
|---|---|
| `Time (UTC)` | `HH:MM`, for example `14:30`. Get it with `date -u +%H:%M`. |
| `Topic` | One row of `## Topics`. |
| `Impact` | Free text. It says what the decision changes. |
| `Replaces` | `D` IDs of earlier decisions, with commas between them. |

- An empty cell or `-` means none.
- A `Topic` column needs a `## Topics` table. The table can have no rows. Then every Topic cell must be empty or `-`.
- `## Topics` has the columns `Topic` and `Meaning`.
- A decision cannot replace itself or a later decision.
- Errors:
  - `a Topic column needs a ## Topics table.`
  - `Time (UTC) "<value>" must look like 14:30.`
  - `Topic "<value>" is not in ## Topics. Use one of: <topics>.`
  - `Replaces "<value>" must be a decision ID like D3.`
  - `unknown decision "<ID>".`
  - `<ID> cannot replace a later decision <ID>.`

### Checks

- A decision with How `classified` shows "not checked by a person" until a person checks it.
- To mark a check, add a row to the optional `## Checks` table. Its columns are `Decision`, `Checked by`, `Date`, `Note`.
- `Decision` is a `D` ID or a ruling ID. `Checked by` is a person ID. `Date` is `YYYY-MM-DD`.
- A row in `## Corrections` for the decision also counts as a check.
- Error: `check names unknown decision "<ID>".`

### Corrections

- A correction replaces one field on the website. The original row stays in the file.
- Add one row for each field that changes.
- `Decision` is a `D` ID or a ruling ID (below). The ID must exist.
- `Field` is `Decision`, `Proposed by`, `Decided by`, `How` or `Evidence`.
- `New value` follows the format of that field. For `Proposed by` and `Decided by`, it is person IDs. For `How`, it is an allowed value.
- `Checked by` is the ID of the person who checked the record. Claude Code can write the row for that person.
- The website shows the new values and "Corrected by {name}, {date}".

### Rulings

- Rulings are decisions of Claude Code. They stay in the ledgers. Never copy a ruling into `decisions.md`.
- The build reads each `plans/*-ledger.md` file, outside a code fence. A ruling line starts with one of these forms:
  `Ruling:`, `Ruling 3:`, `- Ruling:`, `- Ruling 3:`, `Task 4: Ruling:`, `Task 13b: Ruling:`, `Final: Ruling:`.
- A backtick can come before `Ruling`, as in ``- `Ruling: text` ``. Then the build removes the backtick at the end.
- A line that has `Ruling:` later in the line is not a ruling. An example is a deferred finding that quotes `Ruling:`.
- The build adds each ruling to the Decisions page with How `ruling`, and Proposed by and Decided by `claude`.
- The ID of a ruling is `R-<ledger file date>-<topic>-<n>`. `<n>` is the order of the ruling in the ledger, from 1.
- Example: the third ruling in `plans/2026-10-18-m1-ledger.md` is `R-2026-10-18-m1-3`.

## Ledgers

- The superpowers skills keep a working ledger in `.superpowers/sdd/<plan-basename>/progress.md`.
- Git ignores that folder. The superpowers skills delete it when the plan ends. Do not change this.
- The first line of the working ledger is `# SDD ledger — plan: <plan path>`.
- At the end of a milestone, copy the working ledger to `plans/YYYY-MM-DD-<topic>-ledger.md`. Use the date and the topic of the plan file.
- The copy starts with `<skill>/templates/ledger-header.md`. Replace `{{PLAN_PATH}}` with the plan path and `{{DATE}}` with the date of the copy.
- Under the header, the copy has each line of the working ledger, in the same order and without change.
- Remove only the internal agent IDs: the IDs that the harness gives to a subagent.
- The name of a ledger must look like `YYYY-MM-DD-<topic>-ledger.md`. Else the build stops.

## Existing projects

- The record starts at set-up.
- Ask the person before you move files from `docs/superpowers/specs/` and `docs/superpowers/plans/`.
- Move them with `git mv` into `plans/`. Add the kind to the name: a spec becomes `-design.md`, a plan stays `-plan.md`.
- Make decision rows from old transcripts only when the person asks.
- Such a row has How `classified`. Its `Source` is the transcript ID, then `; not checked by a person`.

## `project/releases.md`

The file is optional. It has a `## Releases` table.

| Column | Format |
|---|---|
| `Tag` | `v1.2.0` or `v1.2.0-rc.1`. Never use a tag two times. |
| `Date` | `YYYY-MM-DD` or `YYYY-MM-DDTHH:MMZ`. |
| `Commit` | 7 to 40 lower-case hex digits. |
| `Summary` | One sentence. |
| `Decisions` | `-`, one ID, a comma list, or a range like `D1 to D63`. A range gives the decisions in it that exist. |
| `Results` | `-` or a comma list of result IDs (`H1, H2`). Each one must belong to this release in `results.md`. |

Errors:

- `Tag "<value>" must look like v1.2.3 or v1.2.3-rc.1.`
- `duplicate tag "<value>".`
- `Date "<value>" must look like 2026-10-19 or 2026-10-19T14:30Z.`
- `Commit "<value>" must be 7 to 40 lower-case hex digits.`
- `Decisions "<value>" must be "-", decision IDs, or a range like D1 to D63.`
- `Decisions range "<value>" must go from a lower D number to a higher one.`
- `unknown decision "<ID>".`
- `unknown result "<ID>".`
- `Results lists <ID>, but <ID> has no release.` (or `belongs to release <tag>.`)

## `project/results.md`

The file is optional. It has a `## Results` table.

| Column | Format |
|---|---|
| `ID` | `H1`, `H2`, and so on. Never use an ID two times. |
| `Release` | A tag of `releases.md`, or `-` if not released yet. |
| `Result` | One sentence. |
| `Value` | The value, as text. |
| `Source` | A file path from the repository root, with an optional `#anchor`. Use `/` only. The file must exist. |
| `Decisions` | `-` or a comma list of decision IDs. |
| `Replaces` | `-` or earlier result IDs. |

- A new result that replaces an old one names it in `Replaces`. Never edit the old row.
- A result cannot replace itself or a later result.
- Errors:
  - `ID "<value>" must look like H1.`
  - `duplicate result ID "<value>".`
  - `Release "<value>" is not a tag in releases.md. Use "-" if not released yet.`
  - `Source "<value>" is not a file in the repository.`
  - `unknown decision "<ID>".`
  - `unknown result "<ID>".`
  - `<ID> cannot replace a later result <ID>.`

## `project/contributions.md`

- The file is optional. It is free text by the researchers.
- It can start with an `| Item | Value |` table with the rows Status, Written by and Approved by.
- The site shows it on the Contributions page and as a document page.
- Claude Code can draft it. It is not complete until a researcher approves it.

## `project/process.md`

| Column | Format |
|---|---|
| `Time (UTC)` | `YYYY-MM-DDTHH:MMZ`, for example `2026-10-19T14:30Z`. Get it with `date -u +%Y-%m-%dT%H:%MZ`. |
| `Stage` | One allowed value (below). |
| `Who` | The name of the person, or `Claude Code (<model>, <effort>)`, or `subagent (<model>)`. |
| `What happened` | One sentence. |
| `Records` | The paths of the records that the event made or changed, or `-`. |
| `Session` | The session ID. |

Values of `Stage`:

| Value | The work |
|---|---|
| `inputs` | Collect the inputs: data, sources, set-up of the record. |
| `brainstorm` | Brainstorm and design. |
| `spec-review` | Review of the design spec. |
| `plan` | Write the plan. |
| `build` | Do the tasks of the plan. |
| `evaluate` | Measure and check the results. |
| `paper` | Write the paper. |

- Add a row at each change of stage.
- The end of a milestone is not a stage. Use the stage of the work that ended, for example `build`.
- Write subagent work with the model of the subagent.

## `calls/`

### Budgets in `calls/README.md`

- Make no paid call before a row exists for it.
- Propose the row in the chat first. Write it only after the person approves it.
- `Max calls` and `Max cost (USD)` are numbers, with no `$` sign.
- `Approved by` is the ID of the person who approved the row. Never write an approval that the person did not give.

### Call logs in `calls/<service>-calls.csv`

- The first line is `time_utc,call_id,purpose,model,request_id,status,latency_ms,input_tokens,output_tokens,cost_usd`.
- Write one line for each call. `cost_usd` is a number.
- Leave `cost_usd` empty when a call has no cost, for example a failed call. The build counts it as 0.
- Any other text in `cost_usd` stops the build.
- Claude Code writes the lines for the calls that it makes (probes, tests).
- When the project code makes paid calls, that code writes the same format. The skill supplies no logging helper.
- Stop when the log reaches `Max calls` or `Max cost (USD)` of the budget. Ask for a new row.
- The Progress page shows the paid calls: service, number of calls, total cost and approved budget.

### Rule

A file in `calls/` never contains a key, a token or an authorization header.

## `probes/`

- Each probe has a folder `probes/YYYY-MM-DD-<topic>/` with its scripts and a `README.md`.
- The date in the folder name gives the date on the Records page.
- Start the README from `<skill>/templates/probe-README.md`. Replace each `[...]` marker.

## Labels for statements

Research notes and findings mark the source of each statement:

| Label | The source |
|---|---|
| **Read** | read in a source, with the date |
| **Measured** | a probe |
| **Derived** | a derivation that needs a check |
| **Recalled** | from memory, not checked |

## Placeholders of the set-up templates

| Placeholder | Value |
|---|---|
| `{{PROJECT}}` | The name of the project, for example the repository name. |
| `{{REPOSITORY}}` | The repository URL, `https://github.com/<owner>/<repo>`. |
| `{{OWNER_ID}}` | A short ID for the owner, for example `fmm`. |
| `{{OWNER_NAME}}` | The full name of the owner. `git config user.name` can help. |
| `{{DATE}}` | Today, `date -u +%F`. |
| `{{TIME_UTC}}` | Now, `date -u +%Y-%m-%dT%H:%MZ`. |
| `{{SESSION}}` | The session ID. |

`{{PLAN_PATH}}` is only in `ledger-header.md`. The end-of-milestone procedure fills it.

Set-up fills the `[...]` markers of two files: `README.md` and `project/decisions.md`. No `[...]` marker may remain in these two files. Check them with this command. It must print nothing:

```bash
grep -nE '\[[^]]+\]([^(]|$)' replication_materials/README.md replication_materials/project/decisions.md
```

The check does not cover `plans/`. Plans hold checkboxes such as `- [ ]`, and the record keeps them as they are.
