# Design: the replication-materials skill

| Item | Value |
|---|---|
| Status | Draft for approval |
| Version | 3, dated 2026-10-19. Version 1 went to a builder check by a fresh subagent; version 2 added its answers and D15. Version 3 adds D16 to D20: one repository for all skills, the Miami theme, WCAG 2.2 AA, light theme only. |
| Repository | `fmegahed/claude-skills` (folder `Code/claude/claude-skills/`) |
| Owner | Fadel M. Megahed (Miami University) |
| Written by | Claude Code (Opus 5.5), from the brainstorm of 2026-10-19 |
| Session | Local transcript `b36ad167-66f5-45af-9d6c-bf3f817c6f58`; https://claude.ai/code/session_01CbjAaD4m5kdGha9nnTkFwr |
| Model project | EXPERTA: `../fractional_factorial/replication_materials/` and the artifact https://claude.ai/artifact/8NPtr48KHuQEN3uqxwGk1B |
| Test repository | https://github.com/fmegahed/replication-site-spike (throwaway, public) |

---

## 1. Summary

The skill makes Claude Code keep a replication record in each research project of Fadel M. Megahed. The record shows how the code was made, who decided what (the person or Claude Code), and where the project is. A GitHub Actions workflow builds a website from the record at each push and publishes it on GitHub Pages. The website is a living document. It is not a one-time report.

The skill is a lighter, general version of the EXPERTA `replication_materials/` folder. It keeps all four jobs of that folder (Section 3) with fewer files and no project-specific scripts.

The skill is the first new skill in `fmegahed/claude-skills`, one public repository for all the skills of Fadel. The repository also receives the existing `narrated-demo-video` skill. The default theme of all skills is the Miami University palette. Everything follows WCAG 2.2 AA.

## 2. Why

- Fadel wants a record of his own contributions and of the contributions of Claude Code in every research project.
- Fadel wants good project management of the plan: what is done, what is in progress, what is next.
- Fadel wants to share how a project was made. In EXPERTA, the readers opened the published artifact pages. They did not open the markdown files.
- Other researchers must be able to replicate the process, not only the results.
- In EXPERTA, Claude Code made the attribution of decisions after the work, from the session transcripts. This took effort, and "a person did not check each row". The new skill records each decision when it occurs.

## 3. The four jobs

1. **How the code came to be.** Dated design, plan and ledger documents. Probes that measure facts before a plan uses them. Findings with the script that makes them again.
2. **Who contributed what.** Each decision has who proposed it, who decided it, how, and an evidence line. A person can correct a record.
3. **Project management.** A roadmap of milestones with the states done, now, next, planned and blocked. Open items. The roadmap is current at each step.
4. **Sharing and replication.** One website that shows all of the above. Pinned versions, scripts, call logs and costs that let another researcher do the process again.

## 4. Users

- **Primary:** Fadel M. Megahed, in each of his research projects (R packages, web apps, analyses for papers). He works on Windows 11 with Claude Code and the superpowers skills.
- **Secondary:** other researchers. They read the website. Some of them install the skill for their own projects.

## 5. Goals, non-goals and anti-goals

### Goals

- G1. One command or request ("set up replication materials") prepares a project: folder, templates, build script, workflow, Pages, `CLAUDE.md` block.
- G2. During the work, Claude Code adds decision rows, process rows and call-log rows without a reminder from the person.
- G3. Each push that changes the record updates the website, with no manual step.
- G4. The website has the layout of the EXPERTA artifact (Section 9), the Miami palette, and a good appearance on a phone.
- G5. All text that the skill writes follows the 80% ASD-STE100 rule (Section 12).
- G6. Each page of the website conforms to WCAG 2.2 AA. CI checks this at each push.

### Non-goals (version 1)

- N1. Publication of the website as a claude.ai artifact from CI. This is an open item (Section 15).
- N2. CI templates for hosts other than GitHub (GitLab, Bitbucket). The skill tells the person and does not continue.
- N3. A move of the EXPERTA records into the new format.
- N4. Tools that check ASD-STE100 compliance automatically.
- N5. A Claude Code plugin package or marketplace entry. A plain skill folder is sufficient.
- N6. Logging helpers (R, Python, Node) for paid API calls that the project code makes. The skill defines the CSV format only.

### Anti-goals (a failure even if the skill works)

- A1. Record-keeping that costs more time than the work that it records.
- A2. A website that needs edits by hand after the build.
- A3. Attribution that is not true: a decision shown as the person's decision when Claude Code made it, or the opposite. When the decider is not known, the record says "Unknown".
- A4. An API key, a token or private data in a record, in the website or in a log.
- A5. A conflict with the superpowers skills (two places for specs, two plans for one milestone).

## 6. Constraints

- Windows 11, Git Bash and PowerShell. R 4.6.1 at `C:/Program Files/R/R-4.6.1/bin/Rscript.exe`. Node 22 local and in CI.
- The build script uses Node 22 and no npm packages. Tests of the repository can use npm development packages (for example Playwright and axe-core).
- Colours come only from the Miami palette (Section 9), at 100% opacity, with no tints or shades, and only in the text and background pairings that the brand guide approves.
- WCAG 2.2 AA applies to all pages. There is one theme: light.
- GitHub is the host. GitHub Pages publishes the site. A public website is acceptable (decision D8).
- GitHub Actions are pinned to a full commit SHA, with the tag in a comment.
- In an R package, tests stay in `tests/testthat/`. `R CMD check` does not run tests from another folder.
- Browser libraries load from cdnjs with an exact version.

## 7. Decisions from the brainstorm

Quotes are from the messages of Fadel M. Megahed on 2026-10-19 in the session above. At set-up of the skill repository, these rows go into its `replication_materials/project/decisions.md` in the full format of Section 10 (date, source, person IDs). After that, `decisions.md` is the only source of decisions. The build does not read decision tables inside documents. (Call by Claude Code after the builder check: one source prevents two copies that drift.)

| ID | Decision | Proposed by | Decided by | How | Evidence |
|---|---|---|---|---|---|
| D1 | The skill is primarily for Fadel; other researchers come second. | Fadel M. Megahed | Fadel M. Megahed | chat | "it is primarily for me so I can ensure that any research project of mine I capture how I developed the code" |
| D2 | Keep the four jobs of the EXPERTA folder, but lighter. | Claude Code | Fadel M. Megahed | chat | "Looks right, keep all of it but lighter" |
| D3 | All writing follows the 80% ASD-STE100 rule. | Fadel M. Megahed | Fadel M. Megahed | chat | "use the 80% ASD-STE100 rule in all the writing as well" |
| D4 | The shared record is one living website that GitHub Actions updates. | Fadel M. Megahed | Fadel M. Megahed | chat | "I prefer the end outcome of a single artifact that gets updated with GitHub actions that captures everything" |
| D5 | A project without a remote stops at set-up; the skill asks for a remote with CI. | Fadel M. Megahed | Fadel M. Megahed | chat | "it should ask the user to create a GitHub (or other type of remote) that has automation" |
| D6 | GitHub Pages is acceptable in place of an artifact. | Fadel M. Megahed | Fadel M. Megahed | chat | "if its easier to keep it as a GitHub page, I would be happy with that as well" |
| D7 | Test the CI route in a throwaway public repository. | Claude Code | Fadel M. Megahed | chat | "You can do a throwaway public repo -- this is perfectly fine by me." |
| D8 | A public records website is acceptable. | Claude Code (question) | Fadel M. Megahed | chat | "I am fine with having it public since I will eventually make the code public anyways." |
| D9 | Records are markdown tables, not JSON. | Claude Code | Fadel M. Megahed | playback | Approved with the playback: "Looks right, go ahead and write it up" |
| D10 | Pages render the markdown in the browser (marked, KaTeX). | Claude Code | Fadel M. Megahed | playback | Measured in the test repository; approved with the playback |
| D11 | Set-up adds a block to the project `CLAUDE.md`. | Claude Code | Fadel M. Megahed | playback | Approved with the playback |
| D12 | Specs and plans of the superpowers skills go to `replication_materials/plans/`. | Claude Code | Fadel M. Megahed | playback | Approved with the playback |
| D13 | The skill lives in a public repository and keeps its own record. (D16 sets the repository.) | Claude Code | Fadel M. Megahed | playback | Approved with the playback |
| D14 | In R packages, set-up adds `^replication_materials$` to `.Rbuildignore`. | Claude Code | Fadel M. Megahed | playback | Approved with the playback |
| D15 | Claude Code commits and pushes changes that touch only `replication_materials/` to `main` without asking, so the website is current during a milestone. Code follows the normal branch flow. | Claude Code (builder check) | Fadel M. Megahed | question | Option chosen: "Yes, records to main (Recommended)" |
| D16 | One public repository, `fmegahed/claude-skills`, holds all the skills of Fadel. It has one record and one website for the whole repository. | Fadel M. Megahed | Fadel M. Megahed | chat | "Would it be better to have a single repo with all my claude skills ... should I just call the repo claude-skills?" Claude Code agreed. |
| D17 | The `narrated-demo-video` skill moves into the repository without change. Its generalization for a wider audience is a later milestone with its own design. | Fadel M. Megahed | Fadel M. Megahed | chat | "Should my repo contain boths skills for now and it grows?" |
| D18 | The default theme of all skills is the Miami University palette, from the brand guide. | Fadel M. Megahed | Fadel M. Megahed | chat | "the default color for theming purposes for both is Miami red and we should leverage colors from https://miamioh.edu/brand/style/" |
| D19 | Everything conforms to WCAG 2.2 AA. | Fadel M. Megahed | Fadel M. Megahed | chat | "Also build everything to WCAG 2.2 if possible?" |
| D20 | The website has a light theme only. | Claude Code | Fadel M. Megahed | question | Option chosen: "Light theme only (Recommended)" |
| D21 | The video skill uses ElevenLabs when the user gives an API key, and else the free Microsoft neural voices. This applies to the generalization of the video skill (O6), not to version 1 of this repository. | Fadel M. Megahed | Fadel M. Megahed | chat | "For the video, use ELEVEN_LABS_API if the user is willing to provide an API key for them. Otherwise, use the free microsoft neural voices." |

## 8. Facts measured during the brainstorm

| Fact | Source |
|---|---|
| EXPERTA's Pages workflow was never live: the repository is private, Pages is off (API 404), and `project-site.yml` is not on the default branch. | `gh api`, 2026-10-19 |
| The EXPERTA artifact has 19 files and one version. A session published it once. | Artifact file list, 2026-10-19 |
| The share settings of Fadel's artifacts allow "anyone with the link" and e-mail invitations outside the organization. | Artifact read, 2026-10-19 |
| A workflow that builds one page from markdown records and deploys it to Pages works. A push that changes one record updated the live site in about one minute. | Test repository, commits `7e7b56d` and `de4b394` |
| The SHA pins of EXPERTA agree with their tags: checkout v7.0.1, setup-node v7.0.0, upload-pages-artifact v5.0.0, configure-pages v6.0.0, deploy-pages v5.0.1. | `gh api repos/<action>/commits/<tag>` |
| marked 12.0.2 and KaTeX 0.16.9 (`katex.min.js`, `katex.min.css`, `contrib/auto-render.min.js`) are on cdnjs. Tables and inline math render on the live page. | `curl -I`; screenshot |
| `gh` is logged in as `fmegahed` with the scopes `repo` and `workflow`. It does not have `delete_repo`. | `gh auth status` |
| The Miami palette (Section 9) and the approved text and background pairings. The brand guide approves no pairing on a black background, and it does not permit tints or shades. | Read: https://miamioh.edu/brand/style/ and its images `colors-expanded-colors.png`, `colors-color-combinations.png`, 2026-10-19 |
| Contrast on Warm White: Black 19.96, Miami Red 5.74, Accent Red 6.92, Medium Gray 5.46, Dark Tan 5.22, Slate Blue 7.47. On Light Tan: Miami Red 5.09, Medium Gray 4.84. White on Miami Red: 6.04. | Measured: WCAG 2.x formula, script in the session scratchpad |
| The `narrated-demo-video` skill has 15 files and is not in git. It contains `assets/brand/miami_university_logo.webp` and `assets/brand/ohio_bwc_logo.webp`. | `find`, 2026-10-19 |

## 9. The website

### Pages

| Page | Content |
|---|---|
| Home | Project name and a lead paragraph (from the record README). Status: the current milestone, the next milestone and the date. A strip of the milestones in order, with their states. Counts: decisions by each person, by Claude Code and Unknown. Links to the repository and to the other pages. |
| Records | A table of all documents in `replication_materials/`, in the order in which they were made (the date in the file name). Columns: date, title, kind (design, plan, ledger, investigation, review, findings, probes), status. Filter buttons by kind. Each title links to its document page. |
| Decisions | A table of all decisions: from `decisions.md` and from the `Ruling:` lines of the ledgers. Columns: ID, date, decision, proposed by, decided by, how, evidence, source document. Filter buttons by "decided by" and by "how". A corrected record shows the new values and "Corrected by {name}, {date}". |
| Progress | The milestones with their states and plans. The open items and blockers from `roadmap.md`. For each plan with a ledger: tasks complete out of tasks in the plan. |
| Process | The events of `process.md` by date, and a second view grouped by stage. |
| Document pages | One page for each markdown file under `plans/`, `findings/`, `probes/` and `calls/`, and for the record README. |

The footer of each page says: "Built from commit {sha} on {date}." It links to the repository.

### Appearance

- Use the look of the EXPERTA artifact: serif headings, sans-serif body, a contents rail on wide screens.
- One theme: light. There is no dark theme (D20). The page sets `color-scheme: light`.
- Colour tokens are on `:root`. The default tokens use the Miami palette:

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

- Only the pairings of the brand guide are used for text: on Warm White, White or Light Tan, the text is Black, Miami Red, Accent Red, Medium Gray, Dark Tan or Slate Blue; on Miami Red or Accent Red, the text is White, Warm White or Light Tan.
- `brand/miami.json` at the repository root holds the palette and the approved pairings. It is the one source. A test checks that the default tokens of the build script agree with it.
- A project of another organization can replace the tokens with `theme` in `site.config.json`.

### Accessibility: WCAG 2.2 AA

- Contrast: 4.5:1 for text, 3:1 for large text and for the parts of controls and focus indicators (1.4.3, 1.4.11). The default tokens pass (Section 8).
- Reflow at 320 CSS px with no horizontal scroll of the page, a 16 px side gutter, and text at 200% zoom (1.4.10, 1.4.4). Wide tables scroll inside their own box, and the box can get keyboard focus (`tabindex="0"` with a label).
- Each filter button, navigation link and table link has a target of at least 24 × 24 CSS px (2.5.8).
- A focused element is never hidden under a sticky header or rail (2.4.11): use `scroll-padding-top`, and do not make the header sticky on small screens.
- A visible focus ring of 3 px Miami Red with an offset (2.4.7).
- Filter buttons are `<button>` elements with `aria-pressed`. The count of shown rows is in a polite live region (4.1.2, 4.1.3).
- Tables have `<th scope>` and a caption. Each page has `lang`, a unique `<title>`, one `<h1>`, landmarks and a skip link (1.3.1, 2.4.1, 2.4.2).
- Colour is never the only sign of a state: the milestone states also have a text label (1.4.1).
- Smooth scrolling only when `prefers-reduced-motion` permits it.

### Build

- `node .replication/build-site.mjs --out _site` reads `replication_materials/` and writes `_site/`. It does not need the network.
- Each HTML page is a full document with `<!doctype html>`, charset and viewport.
- Each page embeds its markdown as JSON in a `<script type="application/json">` tag, with `<` escaped. The browser renders it with marked 12.0.2, KaTeX 0.16.9 and DOMPurify from cdnjs. Each script tag has a Subresource Integrity hash.
- Without JavaScript, the page shows the markdown as plain text.
- The build stops with a clear message when a record table does not have the columns of Section 10. It names the file and the line.
- `git log` is optional. Without git, the build uses the dates in the file names.

## 10. The record

### Folder

```
replication_materials/
  README.md          lead paragraph, people, what each folder holds, how to run again
  plans/             YYYY-MM-DD-<topic>-<kind>.md
  probes/<topic>/    scripts and README.md (file | what it measures)
  findings/          YYYY-MM-DD-<topic>-findings.md, script, output
  calls/             README.md (budgets) and <service>-calls.csv
  project/
    roadmap.md       people, milestones, open items
    decisions.md     decisions and corrections
    process.md       events
  environment/       session information, lock files, versions
.replication/
  build-site.mjs     the build script (a copy from the skill)
  site.config.json   project name, repository URL, accent colour
.github/workflows/replication-site.yml
```

### Document names and kinds

- Kinds: `design`, `plan`, `ledger`, `investigation`, `review`, `findings`.
- Each document starts with a table `| Item | Value |` with at least Status, Version (with date) and Written by.

### `roadmap.md`

- `## People`: `| ID | Name | Role | Link |`. IDs are short, for example `fmm`.
- `## Milestones`: `| ID | Milestone | State | Plan | Ledger |`. State is one of `done`, `now`, `next`, `planned`, `blocked`. Plan and Ledger are paths or `-`.
- `## Open items`: `| ID | Item | Blocks | Owner |`.

### `decisions.md`

- `## Decisions`: `| ID | Date | Decision | Proposed by | Decided by | How | Evidence | Source |`.
  - ID: `D1`, `D2`, and so on, in the order of the record.
  - Proposed by and Decided by: a person ID from `roadmap.md`, `claude` (Claude Code), `subagent`, or `unknown`.
  - How: `chat`, `question` (a multiple-choice question in Claude Code), `review`, `measurement`, `plan-approval`, `playback`, or `ruling`.
  - Evidence: a quote of at most 25 words with its date, or the name of the record line.
  - Source: the session ID, or the document and section.
- `## Corrections`: `| Decision | Field | New value | Checked by | Date | Note |`. A correction replaces one field on the website. The original row stays in the file. Decision is a `D` ID or a ruling ID (below).
- Rulings are decisions of Claude Code. They stay in the ledgers. The build finds each line that contains `Ruling:` or `Ruling {n}:` (the formats in the EXPERTA ledgers are `Ruling:`, `- Ruling:`, `Ruling 3:`, `- Ruling 3:`, `Task 4: Ruling:` and `Final: Ruling:`). It adds each ruling to the Decisions page with How `ruling`, decided by `claude`, and the ID `R-{ledger file date}-{topic}-{n}`, where `{n}` is the order in the ledger.

### Ledgers

- The superpowers skills keep their working ledger in `.superpowers/sdd/<plan>/progress.md`. Git ignores that folder, and the skills delete it when the plan ends. The replication skill does not change this. (Measured: superpowers 7.0.0 `sdd-workspace` script.)
- At the end of a milestone, Claude Code copies the working ledger to `replication_materials/plans/YYYY-MM-DD-<topic>-ledger.md`. It adds the `| Item | Value |` table and a short preface on top, and it removes internal agent IDs. This is the EXPERTA method ("copied on 2026-10-15 at the end of the work").
- The Progress page counts tasks from the copied ledgers (lines `Task {n}: complete`). During a milestone, the roadmap state (`now`) shows the progress.

### Existing projects

- The record starts at set-up. Set-up asks the person before it moves existing files from `docs/superpowers/specs/` and `docs/superpowers/plans/` into `replication_materials/plans/` (with `git mv` and the kind suffix).
- Claude Code makes decision rows from old transcripts only when the person asks. Such rows have How `classified` and the note "not checked by a person".

### `process.md`

- `| Time (UTC) | Stage | Who | What happened | Records | Session |`.
- Stage is one of `inputs`, `brainstorm`, `spec-review`, `plan`, `build`, `evaluate`, `paper`.
- Who names the person, or "Claude Code ({model}, {effort})", or "subagent ({model})".

### `calls/`

- `README.md` has `| Date | Service | Purpose | Max calls | Max cost (USD) | Approved by |`. Claude Code makes no paid call before a row exists for it.
- `<service>-calls.csv` has the columns `time_utc, call_id, purpose, model, request_id, status, latency_ms, input_tokens, output_tokens, cost_usd`.
- A file in `calls/` never contains a key, a token or an authorization header.
- Claude Code writes rows for the calls that it makes itself (probes, tests). When the project code makes paid calls (for example thousands of calls in an analysis), that code writes the same CSV format. Version 1 of the skill does not supply logging helpers (non-goal N6).
- The Progress page shows a table of paid calls: service, number of calls, total cost, and approved budget.

### Labels for statements

Research notes and findings mark the source of each statement: **Read** (read in a source, with the date), **Measured** (a probe), **Derived** (a derivation that needs a check), **Recalled** (from memory, not checked).

## 11. The skill

### Files

```
claude-skills/                        (repository root, fmegahed/claude-skills)
  README.md                           the skills, how to install each one
  brand/miami.json                    the Miami palette and approved pairings (one source)
  skills/
    replication-materials/
      SKILL.md                        when to use it and the procedures
      references/record-formats.md    Section 10 in full
      references/writing.md           the 80% ASD-STE100 rules
      references/site.md              the website, the build, the accessibility rules
      templates/                      the record files, the CLAUDE.md block, the workflow, site.config.json
      scripts/build-site.mjs          the build script
    narrated-demo-video/              moved in without change (D17)
  tests/                              tests of the build script and of the accessibility of the pages
  replication_materials/              the record of the whole repository (all skills)
  .replication/                       the copy of the build script that the repository itself uses
  .github/workflows/                  the website and the tests
```

- Each skill folder is self-contained. Installation links one skill folder into `~/.claude/skills/<skill>` (a directory junction on Windows). The `narrated-demo-video` folder in `~/.claude/skills/` becomes a junction to the repository copy.
- The two logo files of `narrated-demo-video` stay out of git (`.gitignore`) until Fadel checks the use rules (O5). The local copy keeps them, so the skill works as before.

### SKILL.md

- The description makes the skill load when the person asks to start a research project, to set up replication materials, to record a decision, or to close a milestone.
- The body has five procedures: set-up, during the work, end of milestone, correction, and update. Each procedure is a numbered list.

### Set-up procedure

1. Check for a git repository. If there is none, ask the person before `git init`.
2. Check for a remote. If there is none, stop. Ask the person to make a GitHub repository with Actions. Continue when the remote exists.
3. If the host is not GitHub, stop. Tell the person that version 1 supports GitHub only.
4. Copy the templates. Do not replace a file that exists; report it.
5. Add the `CLAUDE.md` block (below). For an R package, add `^replication_materials$` and `^\.replication$` to `.Rbuildignore`.
6. Turn on Pages with `gh api -X POST repos/{owner}/{repo}/pages -f build_type=workflow`. If GitHub refuses (for example, a private repository on a free plan), tell the person the choices: make the repository public, use a paid plan (GitHub Education gives Pro to teachers), or keep the record without the website.
7. Write the first rows: the people in `roadmap.md`, a set-up event in `process.md`, the set-up decision in `decisions.md`.
8. Commit, push, and report the website URL after the first run passes.

### The `CLAUDE.md` block

The block is short. It says:

- This project keeps a replication record. Use the replication-materials skill.
- Specs, plans and ledgers go to `replication_materials/plans/` with the names of Section 10. This replaces `docs/superpowers/`.
- Add a decision row when a person or Claude Code decides something. Add a process row at each change of stage.
- Commit and push changes that touch only `replication_materials/` to `main` without asking (decision D15). Do not put code in these commits.
- Make no paid API call without a budget row in `calls/README.md`.
- Write records in 80% ASD-STE100.

### During the work

- A decision is a choice that changes what is built or how. A question with a recommended option that the person accepts is a decision by the person, proposed by Claude Code.
- Claude Code adds the row at the time of the decision, not later.
- Records go to `main` (D15). When the code work is in a git worktree, Claude Code writes and commits the records in the main checkout, which stays on `main`. The feature branch never changes `replication_materials/`, so the merge has no conflicts in the record. When the code work is on a branch in the main checkout (no worktree), the records go on that branch and reach `main` at the merge. (Call by Claude Code.)
- Claude Code pushes record commits in small groups (for example, at each change of stage), not after each row. Each push starts one build of the website.
- The Session column holds the session ID. In a local session it is the name of the newest transcript file in `~/.claude/projects/<folder slug>/`. In a cloud session it is the session URL.
- Subagent work goes into `process.md` with the model of the subagent.

### End of a milestone

1. Set the milestone state in `roadmap.md`. Set the next milestone to `now`.
2. Close the ledger: the last task, the deferred minor items, the commits.
3. Commit and push. Check that the workflow run passed.

### Correction

A person (or Claude Code for a person) adds a row to `## Corrections`. The row names the person who checked it and the date.

### Update

- The skill owns two kinds of file in a project: `.replication/build-site.mjs` and `.github/workflows/replication-site.yml`. The records belong to the project.
- Each skill-owned file has a version line, for example `// replication-materials 1.0.0`. `site.config.json` has `format_version`.
- The update procedure replaces the skill-owned files with the versions in the skill. It never replaces a record.
- The build stops with a clear message when `format_version` is newer than the build script. The message says "Run the update procedure of the replication-materials skill."
- (Call by Claude Code after the builder check: without this, a project keeps an old copy of the script forever, because set-up never replaces a file.)

## 12. Writing: the 80% ASD-STE100 rule

- About 80% of the text follows ASD-STE100: short sentences (at most 20 words in procedures, 25 in descriptions), one instruction for each sentence, active voice, the imperative in procedures, no contractions, one word for one meaning.
- The other 20% allows technical terms (package names, statistical terms) and natural flow where a strict rule makes the text unclear.
- The rule applies to all files that the skill writes. Chat replies can be normal.

## 13. Workflow

- The template is the test workflow (`replication-site-spike/.github/workflows/site.yml`) without the artifact job.
- Triggers: push to `main` with paths `replication_materials/**`, `.replication/**` and the workflow file; `workflow_dispatch`.
- Permissions: none at the top level; `contents: read` for the build job; `pages: write` and `id-token: write` for the deploy job.
- Concurrency group `pages`, with no cancel of a running deploy.
- In the `claude-skills` repository, a second workflow runs the tests at each push and pull request: the unit tests of the build script, and an accessibility check of the built site (Playwright and `@axe-core/playwright` with the tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, at 320 px and at 1280 px width). Any violation fails the run. The project template does not include this workflow in version 1.

## 14. Tests and acceptance

- The build script has unit tests with `node:test`, on fixture records: correct tables, a missing column (a clear error), a correction, a `Ruling:` line, a record with `<script>` text (no script runs).
- The skill is tested with the method of the superpowers writing-skills skill: scenarios run by subagents with and without the skill. These scenarios make no change on GitHub. They run in local folders (with no remote, or with a local bare repository as the remote).
- GitHub repositories (calls by Claude Code after the builder check):
  - Claude Code creates the public repository `fmegahed/claude-skills` (D13, D16).
  - Acceptance test 2 uses the throwaway repository `fmegahed/replication-site-spike` again. Claude Code resets it with a force-push. No other repository is created.
- Acceptance:
  1. The `claude-skills` repository uses the skill on itself. Its website is live and shows this design document, decisions D1 to D21 and the brainstorm events.
  2. A test project goes through set-up from an empty folder to a live website, with `replication-site-spike` as its remote. The test also covers the stop when there is no remote.
  3. A push that changes one record updates the website without a manual step.
  4. Each page of the website has zero axe-core violations for WCAG 2.2 AA at 320 px and at 1280 px width. A keyboard-only pass reaches every link and filter button, and the focus ring is always visible.
  5. The `narrated-demo-video` skill still loads from `~/.claude/skills/` through the junction.

## 15. Open items

| ID | Item |
|---|---|
| O1 | Publication to a claude.ai artifact from CI, for records that must stay private. The test job exists in the test repository. It needs a `CLAUDE_CODE_OAUTH_TOKEN` secret. Not tested. |
| O2 | Support for hosts other than GitHub. |
| O3 | Deletion of the test repository `fmegahed/replication-site-spike`. `gh` needs the `delete_repo` scope (`gh auth refresh -s delete_repo`), or Fadel deletes it on github.com. |
| O4 | A plugin marketplace file (`.claude-plugin/marketplace.json`) so that other researchers can install each skill with `/plugin`. Useful now that the repository has more than one skill. Non-goal N5 for version 1. |
| O5 | The use rules for the Miami logo and the Ohio BWC logo in a public repository. Until Fadel checks them, the logos stay out of git. |
| O6 | The generalization of `narrated-demo-video` for a wider audience (D17). A later milestone with its own design. It starts from D21: ElevenLabs when the user gives a key, else Microsoft neural voices (the skill uses `edge-tts` now). The name of the key variable is for that design. |

## 16. Left to the builder

- The exact text of SKILL.md, of the references and of the templates, within Sections 10 to 12.
- The HTML, CSS and JavaScript of the pages, within Section 9.
- The SRI hashes and the DOMPurify version (an exact version on cdnjs, at least two weeks old).
- The link of the skill into `~/.claude/skills/` on Windows (a directory junction or a copy).
- The structure of the tests.
